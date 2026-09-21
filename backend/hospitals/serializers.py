import datetime
from django.utils import timezone
from rest_framework import serializers
from .models import Hospital, Encounter, Discharge, DataIngestionLog, Alert


def make_aware_if_needed(dt):
    if not dt:
        return None
    if isinstance(dt, datetime.datetime):
        if timezone.is_naive(dt):
            return timezone.make_aware(dt, datetime.timezone.utc)
    return dt


class HospitalSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='display_name', read_only=True)
    city = serializers.CharField(source='display_city', read_only=True)

    class Meta:
        model = Hospital
        fields = [
            'hospital_id',
            'hospital_name',
            'hospital_code',
            'name',
            'city',
            'status',
            'expected_interval_minutes',
            'last_data_received',
            'expected_data_time',
            'delay_minutes',
            'data_frequency',
            'data_volume_mb',
            'records_received',
            'service_status',
            'data_quality',
            'aws_cost',
            'ip_address',
            'region',
            'api_endpoint',
            'created_at',
            'updated_at'
        ]


class EncounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encounter
        fields = '__all__'


class DischargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discharge
        fields = '__all__'


class DataIngestionLogSerializer(serializers.ModelSerializer):
    hospital_name = serializers.SerializerMethodField()
    delay_minutes = serializers.SerializerMethodField()
    integration_status = serializers.SerializerMethodField()

    class Meta:
        model = DataIngestionLog
        fields = [
            'id',
            'hospital_id',
            'hospital_name',
            'data_type',
            'received_at',
            'expected_at',
            'delay_minutes',
            'record_count',
            'data_size_mb',
            'response_time_ms',
            'status',
            'integration_status',
            'error_message',
            'created_at'
        ]

    def get_hospital_name(self, obj):
        if obj.hospital:
            return obj.hospital.display_name
        return obj.hospital_id or ''

    def get_delay_minutes(self, obj):
        if not obj.received_at:
            return 0
        if obj.expected_at:
            received = make_aware_if_needed(obj.received_at)
            expected = make_aware_if_needed(obj.expected_at)
            delta = received - expected
            return max(0, int(delta.total_seconds() / 60))
        now = timezone.now()
        received = make_aware_if_needed(obj.received_at)
        delta = now - received
        return max(0, int(delta.total_seconds() / 60))

    def get_integration_status(self, obj):
        if obj.error_message or (obj.status and obj.status.upper() in ['FAILED', 'ERROR']):
            return 'FAILED'
        delay = self.get_delay_minutes(obj)
        if delay > 30:
            return 'DELAYED'
        if obj.status and obj.status.upper() in ['SUCCESS', 'RECEIVED']:
            return 'RECEIVING'
        return 'RECEIVING' if obj.status == 'SUCCESS' else 'UNKNOWN'


class AlertSerializer(serializers.ModelSerializer):
    hospital_name = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id',
            'hospital_id',
            'hospital_name',
            'alert_type',
            'severity',
            'message',
            'metric_name',
            'metric_value',
            'threshold_value',
            'status',
            'detected_at',
            'resolved_at',
            'created_at',

            # Compatibility fields
            'type',
            'title',
            'time',
            'last_received',
            'expected_time',
            'category',
            'is_read'
        ]

    def get_hospital_name(self, obj):
        h_name = getattr(obj, 'hospital_name', None)
        if h_name:
            return h_name
        if obj.hospital:
            return obj.hospital.display_name
        return ''
