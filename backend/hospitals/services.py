import datetime
from django.utils import timezone
from django.db.models import Count, Max, Q, Avg
from .models import Hospital, Encounter, Discharge, DataIngestionLog, Alert
def make_aware_if_needed(dt):
    if not dt:
        return None
    if isinstance(dt, datetime.datetime):
        if timezone.is_naive(dt):
            return timezone.make_aware(dt, datetime.timezone.utc)
    return dt


def calculate_hospital_status(hospital):
    """
    Calculates current delay and monitoring status for a hospital node based on data_ingestion_log.
    If no ingestion records exist, returns status based on hospital.status (default HEALTHY if ACTIVE).
    """
    latest_log = DataIngestionLog.objects.filter(hospital_id=hospital.hospital_id).order_by('-received_at').first()
    
    if not latest_log or not latest_log.received_at:
        hospital_status = (hospital.status or '').upper()
        if hospital_status in ['HEALTHY', 'ACTIVE']:
            status_val = 'HEALTHY'
        elif hospital_status in ['DELAYED', 'WARNING', 'CRITICAL', 'OFFLINE']:
            status_val = hospital_status
        else:
            status_val = 'HEALTHY'

        return {
            'status': status_val,
            'delay_minutes': hospital.delay_minutes or 0,
            'last_received_at': hospital.last_data_received or None,
            'expected_at': hospital.expected_data_time or None,
            'latest_log': None
        }

    now = timezone.now()
    received_at = make_aware_if_needed(latest_log.received_at)
    delay_delta = now - received_at
    delay_minutes = max(0, int(delay_delta.total_seconds() / 60))
    expected_interval = hospital.expected_interval_minutes or 30

    if delay_minutes <= expected_interval:
        status = 'HEALTHY'
    elif delay_minutes <= expected_interval * 2:
        status = 'DELAYED'
    elif delay_minutes <= expected_interval * 4:
        status = 'WARNING'
    elif delay_minutes <= 1440: # within 24 hours
        status = 'CRITICAL'
    else:
        status = 'OFFLINE'

    return {
        'status': status,
        'delay_minutes': delay_minutes,
        'last_received_at': received_at.isoformat() if received_at else None,
        'expected_at': latest_log.expected_at.isoformat() if latest_log.expected_at else None,
        'latest_log': latest_log
    }


def get_hospital_summary(hospital_id):
    """
    Computes aggregated summary stats for a single hospital.
    """
    hospital = Hospital.objects.filter(hospital_id=hospital_id).first()
    if not hospital:
        return None

    status_info = calculate_hospital_status(hospital)

    encounter_count = Encounter.objects.filter(hospital_id=hospital_id).count()
    discharge_count = Discharge.objects.filter(hospital_id=hospital_id).count()
    active_alerts_count = Alert.objects.filter(
        hospital_id=hospital_id,
        status='ACTIVE'
    ).count()

    latest_log = DataIngestionLog.objects.filter(hospital_id=hospital_id).order_by('-received_at').first()

    ingestion_data = None
    if latest_log:
        ingestion_data = {
            'id': latest_log.id,
            'hospital_id': latest_log.hospital_id,
            'data_type': latest_log.data_type,
            'received_at': latest_log.received_at.isoformat() if latest_log.received_at else None,
            'expected_at': latest_log.expected_at.isoformat() if latest_log.expected_at else None,
            'record_count': latest_log.record_count,
            'status': latest_log.status,
            'response_time_ms': latest_log.response_time_ms,
            'data_size_mb': latest_log.data_size_mb
        }

    return {
        'hospital_id': hospital.hospital_id,
        'hospital_name': hospital.hospital_name or hospital.name or hospital.hospital_code or hospital.hospital_id,
        'name': hospital.name or hospital.hospital_name or hospital.hospital_code or hospital.hospital_id,
        'city': hospital.display_city,
        'hospital_code': hospital.hospital_code,
        'status': status_info['status'],
        'expected_interval_minutes': hospital.expected_interval_minutes,
        'delay_minutes': status_info['delay_minutes'],
        'last_data_received': status_info['last_received_at'] or hospital.last_data_received or 'Just now',
        'expected_data_time': status_info['expected_at'] or hospital.expected_data_time or '12:00 PM',
        'encounter_count': encounter_count,
        'discharge_count': discharge_count,
        'active_alerts_count': active_alerts_count,
        'latest_ingestion': ingestion_data,
        'created_at': hospital.created_at.isoformat() if hospital.created_at else None,
        'updated_at': hospital.updated_at.isoformat() if hospital.updated_at else None,

        # UI Backward Compatibility fields
        'data_frequency': hospital.data_frequency or hospital.expected_interval_minutes,
        'data_volume_mb': hospital.data_volume_mb or (latest_log.data_size_mb if latest_log else 0.0),
        'records_received': hospital.records_received or encounter_count,
        'service_status': hospital.service_status or ('running' if hospital.status == 'ACTIVE' else 'stopped'),
        'data_quality': hospital.data_quality or 100,
        'aws_cost': hospital.aws_cost or 800,
        'ip_address': hospital.ip_address or '10.142.0.1',
        'region': hospital.region or 'ap-south-1'
    }
