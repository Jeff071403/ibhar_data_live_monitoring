import logging
import threading
from datetime import timedelta
from typing import Any, Dict, Optional
from django.utils import timezone

from aws_costs.models import AwsCostSnapshot
from aws_costs.services.factory import get_provider

logger = logging.getLogger(__name__)

_snapshot_lock = threading.Lock()


def build_snapshot_payload(provider=None) -> Dict[str, Any]:
    """
    Executes real provider calls (CE daily 30d, CE forecast, EC2/RDS/Lambda resources, DB health)
    and aggregates them into a single snapshot dictionary.
    Only 1-2 Cost Explorer calls are made across this entire payload generation.
    """
    if provider is None:
        provider = get_provider()

    daily = provider.get_daily_cost()
    by_service_7d = provider.get_cost_by_service()
    forecast = provider.get_forecast()
    resources = provider.get_running_resources()
    health = provider.get_integration_health()
    summary = provider.get_summary()

    now = timezone.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")
    summary["last_updated"] = now_str
    summary["fetched_at"] = now.isoformat()

    return {
        "daily": daily,
        "by_service_7d": by_service_7d,
        "forecast": forecast,
        "resources": resources,
        "health": health,
        "summary": summary,
        "fetched_at": now.isoformat(),
        "last_updated": now_str,
    }


def refresh_aws_cost_snapshot(source: str = "scheduled", force: bool = False) -> AwsCostSnapshot:
    """
    Refreshes the AWS Cost Snapshot. Thread-safe with a lock to prevent concurrent CE calls.
    Returns the newly created or latest good AwsCostSnapshot.
    """
    with _snapshot_lock:
        provider = get_provider()
        try:
            payload = build_snapshot_payload(provider)
            snapshot = AwsCostSnapshot.objects.create(
                payload=payload,
                source=source,
                status="success"
            )
            logger.info(f"Successfully created AWS Cost snapshot ID={snapshot.id} (source={source})")
            return snapshot
        except Exception as e:
            logger.error(f"Failed to refresh AWS Cost snapshot: {e}", exc_info=True)
            latest_good = AwsCostSnapshot.objects.filter(status="success").first()
            if latest_good:
                logger.warning(f"Keeping existing successful snapshot ID={latest_good.id}")
                return latest_good

            # Create fallback error snapshot if no prior snapshot exists
            snapshot = AwsCostSnapshot.objects.create(
                payload={},
                source=source,
                status="error",
                error_message=str(e)
            )
            return snapshot


def get_or_create_latest_snapshot() -> Optional[AwsCostSnapshot]:
    """
    Retrieves the latest successful snapshot, or generates a bootstrap one if none exists.
    Guarded by lock to avoid concurrent bootstrap queries.
    """
    latest = AwsCostSnapshot.objects.filter(status="success").first()
    if latest is not None:
        return latest
    return refresh_aws_cost_snapshot(source="bootstrap")
