"""
Management command to refresh the AWS Cost & Infrastructure Telemetry snapshot.
Calls AWS Cost Explorer once (30-day daily grouped by service) and AWS Budgets/Forecast/CloudWatch,
storing the combined payload in the database.

================================================================================
CRON SCHEDULE CONFIGURATION (Twice daily at 06:00 and 18:00 IST / 00:30 and 12:30 UTC):
================================================================================
Add the following line to your server crontab (e.g. `crontab -e`):

30 0,12 * * * cd /path/to/backend && /path/to/backend/venv/bin/python manage.py refresh_aws_costs >> /var/log/aws_costs_refresh.log 2>&1

This guarantees fresh cost data twice daily while capping AWS Cost Explorer fees
to only ~$0.02 - $0.04/day regardless of how many users view the dashboard.
"""
import logging
from django.core.management.base import BaseCommand
from aws_costs.services.snapshot import refresh_aws_cost_snapshot

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Refreshes the AWS Cost & Telemetry DB snapshot (runs 1-2 CE calls max and caches the snapshot)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force refresh regardless of existing snapshot"
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting AWS Cost Explorer telemetry refresh..."))
        snapshot = refresh_aws_cost_snapshot(source="management_command", force=options.get("force", False))
        
        if snapshot.status == "success":
            self.stdout.write(self.style.SUCCESS(
                f"Successfully refreshed AWS Cost snapshot (ID: {snapshot.id}) at {snapshot.fetched_at}"
            ))
        else:
            self.stdout.write(self.style.ERROR(
                f"Failed to refresh snapshot: {snapshot.error_message}. Retaining last known valid snapshot."
            ))
