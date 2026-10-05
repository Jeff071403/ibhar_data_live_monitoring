import calendar
from datetime import datetime, timedelta
import math
import random
from typing import Any, Dict, List, Optional
from django.utils import timezone

from .base import CostProvider

SERVICES = [
    "Amazon Elastic Compute Cloud - Compute",
    "Amazon Relational Database Service",
    "Amazon Simple Storage Service",
    "AWS Lambda",
    "AmazonCloudWatch",
    "AWS Data Transfer",
]

SERVICE_WEIGHTS = {
    "Amazon Elastic Compute Cloud - Compute": 0.42,
    "Amazon Relational Database Service": 0.35,
    "Amazon Simple Storage Service": 0.08,
    "AWS Lambda": 0.05,
    "AmazonCloudWatch": 0.06,
    "AWS Data Transfer": 0.04,
}


class MockCostProvider(CostProvider):
    """
    Mock implementation returning stable, realistic fake data adhering EXACTLY
    to AWS Cost Explorer, Budgets, and CloudWatch response formats.
    """

    def __init__(self, seed: int = 42):
        self.seed = seed

    def _get_hourly_base_cost(self, dt: datetime) -> float:
        """
        Generates realistic diurnal hourly curve (higher costs during peak business hours).
        Stable based on day and hour.
        """
        hour = dt.hour
        # Peak hospital activity between 09:00 and 19:00
        cycle = math.sin((hour - 6) / 24.0 * 2 * math.pi)
        base = 2.40 + max(0.0, cycle) * 1.80  # ~$2.40/hr up to ~$4.20/hr

        # Seeded random variation per hour for realistic jitter
        rng = random.Random(int(dt.timestamp()) // 3600 + self.seed)
        jitter = rng.uniform(-0.15, 0.25)
        
        # Occasional realistic micro-spike (e.g. at 14:00 yesterday or specific hour)
        if dt.day % 3 == 0 and hour in (14, 15):
            jitter += rng.uniform(0.8, 1.6)

        return max(0.50, round(base + jitter, 4))

    def get_hourly_cost(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Matches AWS Cost Explorer GetCostAndUsage response:
        {
          "ResultsByTime": [
            {
              "TimePeriod": {"Start": "2026-10-04T12:00:00Z", "End": "2026-10-04T13:00:00Z"},
              "Total": {"UnblendedCost": {"Amount": "3.4567", "Unit": "USD"}},
              "Groups": [ ... ]
            }
          ]
        }
        """
        now = end or timezone.now().replace(minute=0, second=0, microsecond=0)
        start_time = start or (now - timedelta(hours=24))

        results_by_time = []
        curr = start_time
        while curr < now:
            nxt = curr + timedelta(hours=1)
            total_amount = self._get_hourly_base_cost(curr)

            groups = []
            for service, weight in SERVICE_WEIGHTS.items():
                rng = random.Random(int(curr.timestamp()) + hash(service))
                srv_jitter = rng.uniform(0.92, 1.08)
                srv_cost = round(total_amount * weight * srv_jitter, 4)
                groups.append({
                    "Keys": [service],
                    "Metrics": {
                        "UnblendedCost": {
                            "Amount": f"{srv_cost:.4f}",
                            "Unit": "USD"
                        }
                    }
                })

            results_by_time.append({
                "TimePeriod": {
                    "Start": curr.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "End": nxt.strftime("%Y-%m-%dT%H:%M:%SZ")
                },
                "Total": {
                    "UnblendedCost": {
                        "Amount": f"{total_amount:.4f}",
                        "Unit": "USD"
                    }
                },
                "Groups": groups,
                "Estimated": curr > (now - timedelta(hours=4))
            })
            curr = nxt

        return {
            "DimensionKeyMetrics": [],
            "GroupDefinitions": [{"Type": "DIMENSION", "Key": "SERVICE"}],
            "ResultsByTime": results_by_time,
            "ResponseMetadata": {"HTTPStatusCode": 200, "RetryAttempts": 0}
        }

    def get_daily_cost(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Matches AWS Cost Explorer GetCostAndUsage response with Granularity='DAILY'.
        """
        now = end or timezone.now().date()
        if isinstance(now, datetime):
            now = now.date()
        start_date = start or (now - timedelta(days=30))
        if isinstance(start_date, datetime):
            start_date = start_date.date()

        results_by_time = []
        curr = start_date
        while curr <= now:
            nxt = curr + timedelta(days=1)
            # Base daily cost around $72 - $98 with weekly pattern
            weekday_mult = 1.15 if curr.weekday() < 5 else 0.85
            rng = random.Random(curr.toordinal() + self.seed)
            day_total = (78.0 + rng.uniform(-6.0, 12.0)) * weekday_mult
            
            # An occasional spike 5 days ago for realistic analysis
            if curr == (now - timedelta(days=5)):
                day_total += 35.50

            day_total = round(day_total, 2)

            groups = []
            for service, weight in SERVICE_WEIGHTS.items():
                srv_jitter = rng.uniform(0.95, 1.05)
                srv_cost = round(day_total * weight * srv_jitter, 2)
                groups.append({
                    "Keys": [service],
                    "Metrics": {
                        "UnblendedCost": {
                            "Amount": f"{srv_cost:.2f}",
                            "Unit": "USD"
                        }
                    }
                })

            results_by_time.append({
                "TimePeriod": {
                    "Start": curr.strftime("%Y-%m-%d"),
                    "End": nxt.strftime("%Y-%m-%d")
                },
                "Total": {
                    "UnblendedCost": {
                        "Amount": f"{day_total:.2f}",
                        "Unit": "USD"
                    }
                },
                "Groups": groups,
                "Estimated": curr >= (now - timedelta(days=2))
            })
            curr = nxt

        return {
            "DimensionKeyMetrics": [],
            "GroupDefinitions": [{"Type": "DIMENSION", "Key": "SERVICE"}],
            "ResultsByTime": results_by_time,
            "ResponseMetadata": {"HTTPStatusCode": 200, "RetryAttempts": 0}
        }

    def get_cost_by_service(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Aggregates total spend by AWS service over the requested window (default past 7 days).
        """
        daily_res = self.get_daily_cost(start=start or (timezone.now().date() - timedelta(days=7)), end=end)
        
        service_totals: Dict[str, float] = {}
        grand_total = 0.0

        for day_entry in daily_res.get("ResultsByTime", []):
            for group in day_entry.get("Groups", []):
                srv_name = group["Keys"][0]
                amt = float(group["Metrics"]["UnblendedCost"]["Amount"])
                service_totals[srv_name] = round(service_totals.get(srv_name, 0.0) + amt, 2)
                grand_total = round(grand_total + amt, 2)

        sorted_services = sorted(
            [{"service": k, "amount": v, "percentage": round((v / grand_total * 100) if grand_total > 0 else 0, 1)}
             for k, v in service_totals.items()],
            key=lambda x: x["amount"],
            reverse=True
        )

        return {
            "start": daily_res["ResultsByTime"][0]["TimePeriod"]["Start"] if daily_res["ResultsByTime"] else "",
            "end": daily_res["ResultsByTime"][-1]["TimePeriod"]["End"] if daily_res["ResultsByTime"] else "",
            "total_cost": grand_total,
            "unit": "USD",
            "services": sorted_services,
            "raw_response": daily_res
        }

    def get_forecast(self) -> Dict[str, Any]:
        """
        Matches AWS Cost Explorer GetCostForecast and Budgets DescribeBudgets structure.
        """
        now = timezone.now()
        year, month = now.year, now.month
        num_days = calendar.monthrange(year, month)[1]
        days_passed = max(1, now.day)
        
        # MTD calculated from days passed
        daily_avg = 82.50
        mtd_cost = round(days_passed * daily_avg + random.Random(self.seed).uniform(-10.0, 15.0), 2)
        projected_total = round(mtd_cost + ((num_days - days_passed) * daily_avg), 2)
        budget_limit = 2800.00
        budget_percent = round((mtd_cost / budget_limit) * 100, 1)

        return {
            "Total": {
                "Amount": f"{projected_total:.2f}",
                "Unit": "USD"
            },
            "ForecastResultsByTime": [
                {
                    "TimePeriod": {
                        "Start": now.strftime("%Y-%m-%d"),
                        "End": f"{year}-{month:02d}-{num_days:02d}"
                    },
                    "MeanValue": f"{projected_total:.2f}",
                    "PredictionIntervalLowerBound": f"{projected_total * 0.94:.2f}",
                    "PredictionIntervalUpperBound": f"{projected_total * 1.07:.2f}"
                }
            ],
            "Budget": {
                "BudgetName": "Ibhar-Production-Monthly-Budget",
                "BudgetLimit": {"Amount": f"{budget_limit:.2f}", "Unit": "USD"},
                "ActualSpend": {"Amount": f"{mtd_cost:.2f}", "Unit": "USD"},
                "ForecastedSpend": {"Amount": f"{projected_total:.2f}", "Unit": "USD"},
                "PercentageUsed": budget_percent,
                "Status": "OK" if projected_total <= budget_limit else "ALARM"
            }
        }

    def get_running_resources(self) -> List[Dict[str, Any]]:
        """
        Returns list of running AWS resources across EC2, RDS, and Lambda.
        """
        return [
            {
                "type": "RDS Instance",
                "id": "ibhar-prod-postgres-db",
                "name": "IBHAR Clinical DB Primary",
                "region": "ap-south-1a",
                "state": "available",
                "state_color": "green",
                "details": "db.m6g.xlarge | Multi-AZ | PostgreSQL 15.4",
                "uptime": "99.98%"
            },
            {
                "type": "RDS Replica",
                "id": "ibhar-prod-postgres-ro",
                "name": "IBHAR Telemetry Read-Replica",
                "region": "ap-south-1b",
                "state": "available",
                "state_color": "green",
                "details": "db.m6g.large | PostgreSQL 15.4",
                "uptime": "99.99%"
            },
            {
                "type": "EC2 Instance",
                "id": "i-09f8e7d6c5b4a3210",
                "name": "ibhar-api-gateway-node-01",
                "region": "ap-south-1a",
                "state": "running",
                "state_color": "green",
                "details": "t4g.xlarge | 10.142.0.12",
                "uptime": "42 days"
            },
            {
                "type": "EC2 Instance",
                "id": "i-01a2b3c4d5e6f7890",
                "name": "ibhar-api-gateway-node-02",
                "region": "ap-south-1b",
                "state": "running",
                "state_color": "green",
                "details": "t4g.xlarge | 10.142.0.18",
                "uptime": "42 days"
            },
            {
                "type": "Lambda Function",
                "id": "arn:aws:lambda:ap-south-1:123456789012:function:ibhar-live-data-ingestor",
                "name": "ibhar-live-data-ingestor",
                "region": "ap-south-1",
                "state": "active",
                "state_color": "green",
                "details": "Python 3.12 | 1024 MB | Invocations: ~24k/hr",
                "uptime": "Active"
            },
            {
                "type": "Lambda Function",
                "id": "arn:aws:lambda:ap-south-1:123456789012:function:ibhar-alert-notifier",
                "name": "ibhar-alert-notifier",
                "region": "ap-south-1",
                "state": "active",
                "state_color": "green",
                "details": "Node.js 20.x | 512 MB | SNS / Webhook Alerts",
                "uptime": "Active"
            },
            {
                "type": "S3 Bucket",
                "id": "ibhar-telemetry-archive-ap-south-1",
                "name": "ibhar-telemetry-archive",
                "region": "ap-south-1",
                "state": "active",
                "state_color": "green",
                "details": "Standard-IA + Glacier Lifecycle | ~1.4 TB",
                "uptime": "100%"
            }
        ]

    def get_integration_health(self) -> Dict[str, Any]:
        """
        Derives hospital database integration health based on RDS CloudWatch telemetry.
        """
        rng = random.Random(int(timezone.now().timestamp()) // 300 + self.seed)
        cpu = round(rng.uniform(22.0, 38.5), 1)
        connections = rng.randint(45, 68)
        free_storage_gb = round(rng.uniform(115.0, 132.0), 1)
        read_latency_ms = round(rng.uniform(1.2, 3.4), 2)
        write_latency_ms = round(rng.uniform(2.1, 5.8), 2)

        # Status rules: healthy unless CPU > 85% or storage < 10GB
        status = "healthy"
        if cpu > 80 or free_storage_gb < 15:
            status = "degraded"
        if cpu > 95 or free_storage_gb < 5:
            status = "down"

        return {
            "status": status,
            "status_label": status.upper(),
            "rds_instance_id": "ibhar-prod-postgres-db",
            "engine": "PostgreSQL 15.4-R2",
            "metrics": {
                "cpu_utilization": {
                    "value": cpu,
                    "unit": "Percent",
                    "status": "normal" if cpu < 70 else "warning"
                },
                "database_connections": {
                    "value": connections,
                    "unit": "Count",
                    "status": "normal" if connections < 100 else "warning"
                },
                "free_storage_space_gb": {
                    "value": free_storage_gb,
                    "unit": "Gigabytes",
                    "status": "normal" if free_storage_gb > 20 else "warning"
                },
                "read_latency_ms": {
                    "value": read_latency_ms,
                    "unit": "Milliseconds",
                    "status": "normal"
                },
                "write_latency_ms": {
                    "value": write_latency_ms,
                    "unit": "Milliseconds",
                    "status": "normal"
                }
            },
            "last_checked": timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    def get_summary(self) -> Dict[str, Any]:
        """
        Summarizes key financial and operational metrics for quick dashboard rendering.
        """
        hourly = self.get_hourly_cost()
        daily = self.get_daily_cost()
        by_service = self.get_cost_by_service()
        forecast = self.get_forecast()
        health = self.get_integration_health()
        resources = self.get_running_resources()

        # Current hour cost
        latest_hour = hourly["ResultsByTime"][-1] if hourly.get("ResultsByTime") else {}
        current_hourly_cost = float(latest_hour.get("Total", {}).get("UnblendedCost", {}).get("Amount", 0.0))

        # Today's cost (sum of hours today)
        today_str = timezone.now().strftime("%Y-%m-%d")
        today_entry = next((d for d in daily.get("ResultsByTime", []) if d["TimePeriod"]["Start"] == today_str), None)
        today_cost = float(today_entry["Total"]["UnblendedCost"]["Amount"]) if today_entry else (current_hourly_cost * 18.0)

        # Top 3 services
        top_services = by_service.get("services", [])[:3]

        return {
            "mode": "mock",
            "is_mock": True,
            "currency": "USD",
            "current_hourly_rate": round(current_hourly_cost, 2),
            "today_cost": round(today_cost, 2),
            "mtd_cost": float(forecast["Budget"]["ActualSpend"]["Amount"]),
            "forecast_cost": float(forecast["Total"]["Amount"]),
            "budget_limit": float(forecast["Budget"]["BudgetLimit"]["Amount"]),
            "budget_used_percent": float(forecast["Budget"]["PercentageUsed"]),
            "budget_status": forecast["Budget"]["Status"],
            "top_services": top_services,
            "running_resources_count": len(resources),
            "integration_health": health["status"],
            "integration_health_details": health,
            "last_updated": timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
