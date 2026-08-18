from django.db import models, transaction
from django.core.validators import RegexValidator

class Hospital(models.Model):
    hospital_id = models.CharField(
        max_length=10,
        primary_key=True,
        validators=[
            RegexValidator(
                regex=r'^HOSP\d{6}$',
                message='HospitalID must be in the format HOSP000001 (HOSP + 6-digit sequence)'
            )
        ]
    )
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    status = models.CharField(
        max_length=50,
        choices=[
            ('healthy', 'Healthy'),
            ('delayed', 'Delayed'),
            ('warning', 'Warning'),
            ('critical', 'Critical'),
            ('offline', 'Offline')
        ],
        default='healthy'
    )
    last_data_received = models.CharField(max_length=100, default='Just now')
    expected_data_time = models.CharField(max_length=100, default='12:00 PM')
    delay_minutes = models.IntegerField(default=0)
    data_frequency = models.IntegerField(default=30)
    data_volume_mb = models.FloatField(default=0.0)
    records_received = models.IntegerField(default=0)
    service_status = models.CharField(
        max_length=50,
        choices=[
            ('running', 'Running'),
            ('degraded', 'Degraded'),
            ('stopped', 'Stopped')
        ],
        default='running'
    )
    data_quality = models.IntegerField(default=100)
    aws_cost = models.IntegerField(default=0)
    ip_address = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=50, default='ap-south-1')
    api_endpoint = models.CharField(max_length=512, blank=True, null=True)

    class Meta:
        db_table = 'hospitals'
        constraints = [
            models.UniqueConstraint(fields=['hospital_id'], name='uq_hospital_id'),
            models.CheckConstraint(
                condition=models.Q(hospital_id__regex=r'^HOSP\d{6}$'),
                name='chk_hospital_id_format'
            )
        ]

    def save(self, *args, **kwargs):
        # Only auto-generate ID if it's not provided
        if not self.hospital_id:
            with transaction.atomic():
                # select_for_update blocks concurrent transactions until this one commits,
                # preventing race conditions on bulk imports.
                last_hosp = Hospital.objects.select_for_update().filter(
                    hospital_id__regex=r'^HOSP\d{6}$'
                ).order_by('-hospital_id').first()
                
                if last_hosp:
                    # Extract sequence number from ID, e.g. "HOSP000012" -> 12
                    last_seq = int(last_hosp.hospital_id[4:])
                else:
                    last_seq = 0
                
                self.hospital_id = f"HOSP{(last_seq + 1):06d}"
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.hospital_id})"


class Alert(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='alerts', blank=True, null=True)
    hospital_name = models.CharField(max_length=255)
    type = models.CharField(max_length=50) # critical, warning, resolved
    title = models.CharField(max_length=255)
    message = models.TextField()
    time = models.CharField(max_length=100) # serves as timestamp
    last_received = models.CharField(max_length=100, default='')
    expected_time = models.CharField(max_length=100, default='')
    category = models.CharField(max_length=50, default='delay') # delay, volume, service, quality
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'alerts'

    def __str__(self):
        return f"{self.title} - {self.hospital_name}"
