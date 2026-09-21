import datetime
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Max, Min, Q
from .models import Hospital, Encounter, Discharge, DataIngestionLog, Alert
from .services import calculate_hospital_status, make_aware_if_needed


def parse_date_filters(filters):
    """
    Parses start_date and end_date from filter dictionary.
    Supports presets: 'today', '7days', '30days' or custom YYYY-MM-DD strings.
    """
    date_preset = filters.get('date_preset')
    start_date_str = filters.get('start_date')
    end_date_str = filters.get('end_date')

    now = timezone.now()
    start_dt = None
    end_dt = None

    if date_preset == 'today':
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif date_preset == '7days':
        start_dt = now - datetime.timedelta(days=7)
        end_dt = now
    elif date_preset == '30days':
        start_dt = now - datetime.timedelta(days=30)
        end_dt = now
    elif start_date_str or end_date_str:
        if start_date_str:
            try:
                dt = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
                start_dt = timezone.make_aware(dt, datetime.timezone.utc)
            except ValueError:
                pass
        if end_date_str:
            try:
                dt = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')
                dt = dt.replace(hour=23, minute=59, second=59)
                end_dt = timezone.make_aware(dt, datetime.timezone.utc)
            except ValueError:
                pass

    return start_dt, end_dt


def apply_common_log_filters(queryset, filters):
    """
    Filters DataIngestionLog by start_date, end_date, hospital_id, data_type, status.
    """
    start_dt, end_dt = parse_date_filters(filters)
    if start_dt:
        queryset = queryset.filter(
            Q(received_at__gte=start_dt) | Q(created_at__gte=start_dt)
        )
    if end_dt:
        queryset = queryset.filter(
            Q(received_at__lte=end_dt) | Q(created_at__lte=end_dt)
        )

    hospital_id = filters.get('hospital_id')
    if hospital_id and hospital_id.upper() != 'ALL':
        queryset = queryset.filter(hospital_id=hospital_id)

    data_type = filters.get('data_type')
    if data_type and data_type.upper() != 'ALL':
        queryset = queryset.filter(data_type__iexact=data_type)

    status_param = filters.get('status')
    if status_param and status_param.upper() != 'ALL':
        queryset = queryset.filter(status__iexact=status_param)

    return queryset


def get_reports_overview(filters):
    """
    Returns summary metadata for each report card showing real record counts.
    """
    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters)
    hospitals_qs = Hospital.objects.all()

    hospital_id = filters.get('hospital_id')
    if hospital_id and hospital_id.upper() != 'ALL':
        hospitals_qs = hospitals_qs.filter(hospital_id=hospital_id)

    enc_qs = Encounter.objects.all()
    dis_qs = Discharge.objects.all()
    alerts_qs = Alert.objects.all()

    start_dt, end_dt = parse_date_filters(filters)
    if start_dt:
        enc_qs = enc_qs.filter(created_at__gte=start_dt)
        dis_qs = dis_qs.filter(created_at__gte=start_dt)
        alerts_qs = alerts_qs.filter(Q(detected_at__gte=start_dt) | Q(created_at__gte=start_dt))
    if end_dt:
        enc_qs = enc_qs.filter(created_at__lte=end_dt)
        dis_qs = dis_qs.filter(created_at__lte=end_dt)
        alerts_qs = alerts_qs.filter(Q(detected_at__lte=end_dt) | Q(created_at__lte=end_dt))
    if hospital_id and hospital_id.upper() != 'ALL':
        enc_qs = enc_qs.filter(hospital_id=hospital_id)
        dis_qs = dis_qs.filter(hospital_id=hospital_id)
        alerts_qs = alerts_qs.filter(hospital_id=hospital_id)

    severity_param = filters.get('severity')
    if severity_param and severity_param.upper() != 'ALL':
        alerts_qs = alerts_qs.filter(severity__iexact=severity_param)

    # 1. Data Summary Count
    summary_count = logs_qs.count() + enc_qs.count() + dis_qs.count()

    # 2. Delay Count
    delay_count = logs_qs.exclude(status='SUCCESS').count()
    if delay_count == 0:
        delay_count = logs_qs.count()

    # 3. Volume Count
    volume_count = logs_qs.count()

    # 4. Latency Count
    latency_count = logs_qs.filter(response_time_ms__isnull=False).count()

    # 5. Error Count
    error_logs_count = logs_qs.filter(
        Q(status__in=['FAILED', 'ERROR']) | (Q(error_message__isnull=False) & ~Q(error_message=''))
    ).count()
    error_alerts_count = alerts_qs.count()
    error_count = error_logs_count + error_alerts_count

    # 6. Integration Health Count
    health_count = hospitals_qs.count()

    last_gen = timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')

    return [
        {
            "id": "data-summary",
            "title": "Data Summary Report",
            "type": "pdf",
            "iconName": "FileText",
            "recordCount": summary_count,
            "fileSize": f"{max(1, summary_count * 2)} KB",
            "lastGenerated": last_gen,
            "description": "Executive summary of total hospital encounters, discharges, ingested payload volumes and overall API response rates."
        },
        {
            "id": "delay-report",
            "title": "Delay & Lag Audit Report",
            "type": "pdf",
            "iconName": "Clock",
            "recordCount": delay_count,
            "fileSize": f"{max(1, delay_count * 2)} KB",
            "lastGenerated": last_gen,
            "description": "Comprehensive audit of transmission delays, expected vs actual arrival timestamps, and lag duration across hospital telemetry pipelines."
        },
        {
            "id": "volume-report",
            "title": "Data Volume & Payload Report",
            "type": "pdf",
            "iconName": "HardDrive",
            "recordCount": volume_count,
            "fileSize": f"{max(1, volume_count * 2)} KB",
            "lastGenerated": last_gen,
            "description": "Detailed analysis of incoming payload sizes (MB), total record throughput counts, and minimum/maximum volume statistics."
        },
        {
            "id": "latency-report",
            "title": "Latency & Response Time Report",
            "type": "pdf",
            "iconName": "Clock",
            "recordCount": latency_count,
            "fileSize": f"{max(1, latency_count * 2)} KB",
            "lastGenerated": last_gen,
            "description": "API response latency metrics in milliseconds, identifying performance baseline compliance and high latency spikes."
        },
        {
            "id": "error-report",
            "title": "Error & Ingestion Failure Report",
            "type": "pdf",
            "iconName": "Activity",
            "recordCount": error_count,
            "fileSize": f"{max(1, error_count * 2)} KB",
            "lastGenerated": last_gen,
            "description": "Audit log of ingestion errors, connection failures, alert logs, and system exception traces for technical triage."
        },
        {
            "id": "integration-health-report",
            "title": "Integration Health Report",
            "type": "pdf",
            "iconName": "Activity",
            "recordCount": health_count,
            "fileSize": f"{max(1, health_count * 2)} KB",
            "lastGenerated": last_gen,
            "description": "Matrix of hospital telemetry connection statuses (Healthy, Delayed, Critical, Offline) with frequency & alert counts."
        }
    ]


def get_data_summary_report(filters):
    """
    Computes real summary metrics across hospitals, encounters, discharges, data_ingestion_log.
    """
    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters)
    hospitals_qs = Hospital.objects.all()

    hospital_id = filters.get('hospital_id')
    if hospital_id and hospital_id.upper() != 'ALL':
        hospitals_qs = hospitals_qs.filter(hospital_id=hospital_id)

    enc_qs = Encounter.objects.all()
    dis_qs = Discharge.objects.all()

    start_dt, end_dt = parse_date_filters(filters)
    if start_dt:
        enc_qs = enc_qs.filter(created_at__gte=start_dt)
        dis_qs = dis_qs.filter(created_at__gte=start_dt)
    if end_dt:
        enc_qs = enc_qs.filter(created_at__lte=end_dt)
        dis_qs = dis_qs.filter(created_at__lte=end_dt)
    if hospital_id and hospital_id.upper() != 'ALL':
        enc_qs = enc_qs.filter(hospital_id=hospital_id)
        dis_qs = dis_qs.filter(hospital_id=hospital_id)

    agg = logs_qs.aggregate(
        total_records=Sum('record_count'),
        total_vol=Sum('data_size_mb'),
        avg_resp=Avg('response_time_ms')
    )

    latest_log = logs_qs.order_by('-received_at').first()
    latest_time_str = None
    if latest_log and (latest_log.received_at or latest_log.created_at):
        t = latest_log.received_at or latest_log.created_at
        latest_time_str = make_aware_if_needed(t).isoformat()

    hospital_breakdown = []
    for h in hospitals_qs.order_by('hospital_id'):
        h_logs = logs_qs.filter(hospital_id=h.hospital_id)
        h_enc = enc_qs.filter(hospital_id=h.hospital_id).count()
        h_dis = dis_qs.filter(hospital_id=h.hospital_id).count()
        h_agg = h_logs.aggregate(
            rec=Sum('record_count'),
            vol=Sum('data_size_mb'),
            resp=Avg('response_time_ms')
        )
        hospital_breakdown.append({
            "hospital_id": h.hospital_id,
            "hospital_name": h.display_name,
            "hospital_code": h.hospital_code or h.hospital_id,
            "encounters_count": h_enc,
            "discharges_count": h_dis,
            "records_received": h_agg['rec'] or 0,
            "data_volume_mb": round(h_agg['vol'] or 0.0, 2),
            "avg_response_time_ms": int(h_agg['resp']) if h_agg['resp'] is not None else 0
        })

    recent_logs = logs_qs.order_by('received_at')[:30]
    trend_points = []
    for l in recent_logs:
        if l.received_at or l.created_at:
            t = l.received_at or l.created_at
            trend_points.append({
                "timestamp": make_aware_if_needed(t).isoformat(),
                "time_label": t.strftime('%H:%M'),
                "record_count": l.record_count or 0,
                "data_size_mb": l.data_size_mb or 0.0,
                "response_time_ms": l.response_time_ms or 0
            })

    return {
        "report_title": "Data Summary Report",
        "generated_at": timezone.now().isoformat(),
        "filters_applied": filters,
        "summary": {
            "total_hospitals": hospitals_qs.count(),
            "total_encounters": enc_qs.count(),
            "total_discharges": dis_qs.count(),
            "total_records_received": agg['total_records'] or 0,
            "total_data_volume_mb": round(agg['total_vol'] or 0.0, 2),
            "average_response_time_ms": int(agg['avg_resp']) if agg['avg_resp'] is not None else 0,
            "latest_ingestion_time": latest_time_str
        },
        "breakdown": hospital_breakdown,
        "trend_points": trend_points
    }


def get_delay_report(filters):
    """
    Computes delay report metrics and log rows sorted by delay duration.
    """
    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters).order_by('-received_at')
    now = timezone.now()

    rows = []
    hospitals_map = {h.hospital_id: h for h in Hospital.objects.all()}

    for l in logs_qs:
        h_obj = hospitals_map.get(l.hospital_id)
        hospital_name = h_obj.display_name if h_obj else (l.hospital_id or "Unknown")
        exp_interval = h_obj.expected_interval_minutes if h_obj else 30

        received_at_dt = make_aware_if_needed(l.received_at or l.created_at)
        expected_at_dt = make_aware_if_needed(l.expected_at)

        if expected_at_dt and received_at_dt:
            delta = received_at_dt - expected_at_dt
            delay_min = max(0, int(delta.total_seconds() / 60))
        elif received_at_dt:
            delta = now - received_at_dt
            delay_min = max(0, int(delta.total_seconds() / 60))
        else:
            delay_min = 0

        if delay_min <= exp_interval:
            row_status = "ON_TIME"
        elif delay_min <= exp_interval * 2:
            row_status = "SLIGHT_DELAY"
        else:
            row_status = "CRITICAL_DELAY"

        rows.append({
            "id": l.id,
            "hospital_id": l.hospital_id,
            "hospital_name": hospital_name,
            "data_type": l.data_type or "TELEMETRY",
            "expected_time": expected_at_dt.isoformat() if expected_at_dt else (h_obj.expected_data_time if h_obj else "12:00 PM"),
            "actual_received_time": received_at_dt.isoformat() if received_at_dt else "N/A",
            "delay_minutes": delay_min,
            "status": l.status or row_status,
            "delay_severity": row_status,
            "last_successful_ingestion": received_at_dt.isoformat() if (l.status == 'SUCCESS' and received_at_dt) else "N/A"
        })

    rows.sort(key=lambda x: x['delay_minutes'], reverse=True)

    delayed_rows = [r for r in rows if r['delay_minutes'] > 0]
    total_delay_min = sum(r['delay_minutes'] for r in rows)
    avg_delay_min = round(total_delay_min / len(rows), 1) if rows else 0.0
    max_delay_min = max((r['delay_minutes'] for r in rows), default=0)

    chart_points = []
    for r in rows[:30]:
        chart_points.append({
            "hospital_name": r['hospital_name'],
            "delay_minutes": r['delay_minutes'],
            "status": r['status']
        })

    return {
        "report_title": "Delay & Lag Audit Report",
        "generated_at": timezone.now().isoformat(),
        "filters_applied": filters,
        "summary": {
            "total_records_evaluated": len(rows),
            "delayed_records_count": len(delayed_rows),
            "average_delay_minutes": avg_delay_min,
            "maximum_delay_minutes": max_delay_min
        },
        "rows": rows,
        "chart_points": chart_points
    }


def get_volume_report(filters):
    """
    Computes volume & payload throughput statistics.
    """
    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters).order_by('-received_at')
    hospitals_map = {h.hospital_id: h for h in Hospital.objects.all()}

    agg = logs_qs.aggregate(
        total_vol=Sum('data_size_mb'),
        avg_vol=Avg('data_size_mb'),
        max_vol=Max('data_size_mb'),
        min_vol=Min('data_size_mb'),
        total_rec=Sum('record_count')
    )

    rows = []
    for l in logs_qs:
        h_obj = hospitals_map.get(l.hospital_id)
        received_dt = make_aware_if_needed(l.received_at or l.created_at)
        rows.append({
            "id": l.id,
            "hospital_id": l.hospital_id,
            "hospital_name": h_obj.display_name if h_obj else (l.hospital_id or "Unknown"),
            "data_type": l.data_type or "TELEMETRY",
            "timestamp": received_dt.isoformat() if received_dt else "N/A",
            "record_count": l.record_count or 0,
            "data_size_mb": round(l.data_size_mb or 0.0, 3)
        })

    trend_points = []
    for r in reversed(rows[:30]):
        trend_points.append({
            "timestamp": r['timestamp'],
            "hospital_name": r['hospital_name'],
            "record_count": r['record_count'],
            "data_size_mb": r['data_size_mb']
        })

    return {
        "report_title": "Data Volume & Payload Report",
        "generated_at": timezone.now().isoformat(),
        "filters_applied": filters,
        "summary": {
            "total_volume_mb": round(agg['total_vol'] or 0.0, 2),
            "average_volume_mb": round(agg['avg_vol'] or 0.0, 3),
            "maximum_volume_mb": round(agg['max_vol'] or 0.0, 3),
            "minimum_volume_mb": round(agg['min_vol'] or 0.0, 3),
            "total_records": agg['total_rec'] or 0
        },
        "rows": rows,
        "trend_points": trend_points
    }


def get_latency_report(filters):
    """
    Computes latency statistics and response time breakdown.
    """
    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters).filter(
        response_time_ms__isnull=False
    ).order_by('-received_at')

    hospitals_map = {h.hospital_id: h for h in Hospital.objects.all()}

    agg = logs_qs.aggregate(
        avg_resp=Avg('response_time_ms'),
        max_resp=Max('response_time_ms'),
        min_resp=Min('response_time_ms')
    )

    baseline_avg = agg['avg_resp'] or 150.0

    rows = []
    high_latency_count = 0

    for l in logs_qs:
        h_obj = hospitals_map.get(l.hospital_id)
        resp_ms = l.response_time_ms or 0
        received_dt = make_aware_if_needed(l.received_at or l.created_at)

        is_spike = resp_ms > max(500, baseline_avg * 2.5)
        if is_spike:
            high_latency_count += 1

        rows.append({
            "id": l.id,
            "hospital_id": l.hospital_id,
            "hospital_name": h_obj.display_name if h_obj else (l.hospital_id or "Unknown"),
            "data_type": l.data_type or "TELEMETRY",
            "timestamp": received_dt.isoformat() if received_dt else "N/A",
            "response_time_ms": resp_ms,
            "baseline_avg_ms": int(baseline_avg),
            "is_high_latency_spike": is_spike
        })

    trend_points = []
    for r in reversed(rows[:30]):
        trend_points.append({
            "timestamp": r['timestamp'],
            "hospital_name": r['hospital_name'],
            "response_time_ms": r['response_time_ms']
        })

    return {
        "report_title": "Latency & Response Time Report",
        "generated_at": timezone.now().isoformat(),
        "filters_applied": filters,
        "summary": {
            "total_requests_evaluated": len(rows),
            "average_response_time_ms": int(agg['avg_resp']) if agg['avg_resp'] is not None else 0,
            "maximum_response_time_ms": agg['max_resp'] or 0,
            "minimum_response_time_ms": agg['min_resp'] or 0,
            "high_latency_spikes_count": high_latency_count
        },
        "rows": rows,
        "trend_points": trend_points
    }


def get_error_report(filters):
    """
    Computes error / ingestion failure report from data_ingestion_log and alerts.
    Only includes actual error / failure records.
    """
    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters)
    failed_logs = logs_qs.filter(
        Q(status__in=['FAILED', 'ERROR']) | (Q(error_message__isnull=False) & ~Q(error_message=''))
    ).order_by('-received_at')

    alerts_qs = Alert.objects.all().order_by('-detected_at')
    start_dt, end_dt = parse_date_filters(filters)
    if start_dt:
        alerts_qs = alerts_qs.filter(Q(detected_at__gte=start_dt) | Q(created_at__gte=start_dt))
    if end_dt:
        alerts_qs = alerts_qs.filter(Q(detected_at__lte=end_dt) | Q(created_at__lte=end_dt))

    hospital_id = filters.get('hospital_id')
    if hospital_id and hospital_id.upper() != 'ALL':
        alerts_qs = alerts_qs.filter(hospital_id=hospital_id)

    severity_param = filters.get('severity')
    if severity_param and severity_param.upper() != 'ALL':
        alerts_qs = alerts_qs.filter(severity__iexact=severity_param)

    hospitals_map = {h.hospital_id: h for h in Hospital.objects.all()}

    rows = []

    for l in failed_logs:
        h_obj = hospitals_map.get(l.hospital_id)
        received_dt = make_aware_if_needed(l.received_at or l.created_at)
        rows.append({
            "id": f"LOG_{l.id}",
            "source": "IngestionLog",
            "hospital_id": l.hospital_id,
            "hospital_name": h_obj.display_name if h_obj else (l.hospital_id or "Unknown"),
            "data_type": l.data_type or "TELEMETRY",
            "timestamp": received_dt.isoformat() if received_dt else "N/A",
            "status": l.status or "FAILED",
            "error_message": l.error_message or f"Ingestion error with status {l.status}",
            "alert_type": "INGESTION_ERROR",
            "severity": "CRITICAL" if l.status == 'FAILED' else "WARNING",
            "detected_at": received_dt.isoformat() if received_dt else "N/A"
        })

    for a in alerts_qs:
        h_obj = hospitals_map.get(a.hospital_id)
        dt = make_aware_if_needed(a.detected_at or a.created_at)
        rows.append({
            "id": f"ALERT_{a.id}",
            "source": "AlertSystem",
            "hospital_id": a.hospital_id,
            "hospital_name": h_obj.display_name if h_obj else (a.hospital_id or "Unknown"),
            "data_type": a.metric_name or "ALERT",
            "timestamp": dt.isoformat() if dt else "N/A",
            "status": a.status or "ACTIVE",
            "error_message": a.message or f"System alert: {a.alert_type}",
            "alert_type": a.alert_type or "ALERT",
            "severity": a.severity or "WARNING",
            "detected_at": dt.isoformat() if dt else "N/A"
        })

    rows.sort(key=lambda x: x['timestamp'], reverse=True)

    critical_count = sum(1 for r in rows if r['severity'] == 'CRITICAL')
    warning_count = sum(1 for r in rows if r['severity'] == 'WARNING')

    return {
        "report_title": "Error & Ingestion Failure Report",
        "generated_at": timezone.now().isoformat(),
        "filters_applied": filters,
        "summary": {
            "total_errors_found": len(rows),
            "critical_errors_count": critical_count,
            "warning_errors_count": warning_count,
            "failed_ingestion_logs": failed_logs.count(),
            "active_alerts_count": alerts_qs.count()
        },
        "rows": rows,
        "message": "No failures found for the selected period." if len(rows) == 0 else None
    }


def get_integration_health_report(filters):
    """
    Computes overall integration health matrix across all hospitals.
    """
    hospitals_qs = Hospital.objects.all().order_by('hospital_id')
    hospital_id = filters.get('hospital_id')
    if hospital_id and hospital_id.upper() != 'ALL':
        hospitals_qs = hospitals_qs.filter(hospital_id=hospital_id)

    logs_qs = apply_common_log_filters(DataIngestionLog.objects.all(), filters)

    rows = []
    healthy_count = 0
    delayed_count = 0
    critical_count = 0
    offline_count = 0

    for h in hospitals_qs:
        status_info = calculate_hospital_status(h)
        st = status_info['status']

        if st == 'HEALTHY':
            healthy_count += 1
        elif st == 'DELAYED':
            delayed_count += 1
        elif st == 'CRITICAL' or st == 'WARNING':
            critical_count += 1
        else:
            offline_count += 1

        latest_log = logs_qs.filter(hospital_id=h.hospital_id).order_by('-received_at').first()
        active_alerts = Alert.objects.filter(hospital_id=h.hospital_id, status='ACTIVE').count()

        last_received_dt = make_aware_if_needed(latest_log.received_at if latest_log else None)
        expected_dt = make_aware_if_needed(latest_log.expected_at if latest_log else None)

        rows.append({
            "hospital_id": h.hospital_id,
            "hospital_name": h.display_name,
            "hospital_code": h.hospital_code or h.hospital_id,
            "current_status": st,
            "last_received": last_received_dt.isoformat() if last_received_dt else (h.last_data_received or "N/A"),
            "expected_time": expected_dt.isoformat() if expected_dt else (h.expected_data_time or "12:00 PM"),
            "delay_minutes": status_info['delay_minutes'],
            "data_frequency_minutes": h.expected_interval_minutes or 30,
            "latest_record_count": latest_log.record_count if latest_log else 0,
            "latest_volume_mb": round(latest_log.data_size_mb or 0.0, 3) if latest_log else 0.0,
            "latest_response_time_ms": latest_log.response_time_ms if latest_log else 0,
            "active_alerts_count": active_alerts
        })

    return {
        "report_title": "Integration Health Report",
        "generated_at": timezone.now().isoformat(),
        "filters_applied": filters,
        "summary": {
            "total_hospitals": len(rows),
            "healthy_hospitals": healthy_count,
            "delayed_hospitals": delayed_count,
            "critical_hospitals": critical_count,
            "offline_hospitals": offline_count
        },
        "rows": rows
    }
