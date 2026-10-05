import datetime
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .live_sync_service import (
    get_live_dashboard,
    get_live_hospital_summary,
    fetch_hospital_sync_details,
    aggregate_hospital_sync_details,
)


@extend_schema(
    summary="Live Hospital Monitoring Dashboard",
    description="Fetches and aggregates real-time data synchronization telemetry across configured hospitals from the external GetDataSyncDetails REST API.",
    parameters=[
        OpenApiParameter("days", int, description="Optional rolling date filter in days (e.g. 3, 7)"),
        OpenApiParameter("FromDate", str, description="Optional start datetime ISO filter"),
        OpenApiParameter("ToDate", str, description="Optional end datetime ISO filter"),
    ],
    responses={200: dict}
)
@api_view(["GET"])
@permission_classes([AllowAny])
def live_dashboard(request):
    """
    GET /api/live/dashboard/
    Aggregates real-time sync telemetry from external API across all configured hospitals.
    """
    extra_params = {}
    days_param = request.query_params.get("days")
    if days_param:
        try:
            days_int = int(days_param)
            from_dt = timezone.now() - datetime.timedelta(days=days_int)
            extra_params["FromDate"] = from_dt.strftime("%Y-%m-%dT%H:%M:%S")
            extra_params["ToDate"] = timezone.now().strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            pass

    from_date = request.query_params.get("FromDate")
    to_date = request.query_params.get("ToDate")
    if from_date:
        extra_params["FromDate"] = from_date
    if to_date:
        extra_params["ToDate"] = to_date

    dashboard_data = get_live_dashboard(extra_params=extra_params if extra_params else None)

    return Response({
        "success": True,
        "hospitals": dashboard_data["hospitals"],
        "hospital_count": dashboard_data["hospital_count"],
        "data": dashboard_data,
    }, status=status.HTTP_200_OK)


@extend_schema(
    summary="Live Individual Hospital Summary",
    description="Fetches and aggregates real-time data synchronization telemetry for a single hospital from the external GetDataSyncDetails REST API.",
    parameters=[
        OpenApiParameter("days", int, description="Optional rolling date filter in days (e.g. 3, 7)"),
        OpenApiParameter("FromDate", str, description="Optional start datetime ISO filter"),
        OpenApiParameter("ToDate", str, description="Optional end datetime ISO filter"),
    ],
    responses={200: dict}
)
@api_view(["GET"])
@permission_classes([AllowAny])
def live_hospital(request, code: str):
    """
    GET /api/live/hospitals/<str:code>/
    Fetches real-time sync telemetry for a single hospital code.
    """
    extra_params = {}
    days_param = request.query_params.get("days")
    if days_param:
        try:
            days_int = int(days_param)
            from_dt = timezone.now() - datetime.timedelta(days=days_int)
            extra_params["FromDate"] = from_dt.strftime("%Y-%m-%dT%H:%M:%S")
            extra_params["ToDate"] = timezone.now().strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            pass

    from_date = request.query_params.get("FromDate")
    to_date = request.query_params.get("ToDate")
    if from_date:
        extra_params["FromDate"] = from_date
    if to_date:
        extra_params["ToDate"] = to_date

    hospital_data = get_live_hospital_summary(
        hospital_code=code,
        extra_params=extra_params if extra_params else None,
    )

    return Response({
        "success": True,
        **hospital_data,
        "data": hospital_data,
    }, status=status.HTTP_200_OK)
