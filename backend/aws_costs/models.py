from django.db import models
from django.utils import timezone


class AwsCostSnapshot(models.Model):
    """
    Persisted snapshot of AWS Cost & Infrastructure telemetry.
    Generated twice daily (or on-demand by staff) to minimize Cost Explorer API fees ($0.01/call).
    """
    fetched_at = models.DateTimeField(default=timezone.now, db_index=True)
    payload = models.JSONField(help_text="Aggregated payload containing daily, by_service, forecast, summary, resources, and health telemetry.")
    source = models.CharField(max_length=50, default="scheduled", help_text="Origin of snapshot (e.g. scheduled, management_command, manual, bootstrap)")
    status = models.CharField(max_length=20, default="success", help_text="Status of snapshot: success or error")
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-fetched_at"]
        verbose_name = "AWS Cost Snapshot"
        verbose_name_plural = "AWS Cost Snapshots"

    def __str__(self):
        return f"AwsCostSnapshot(id={self.id}, fetched_at={self.fetched_at.strftime('%Y-%m-%d %H:%M:%S UTC')}, status={self.status})"
