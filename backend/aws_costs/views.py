from datetime import timedelta
import logging
from django.conf import settings
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services.factory import get_provider

logger = logging.getLogger(__name__)


def dashboard_page_view(request):
    """
    Renders the AWS Cost & Telemetry Dashboard HTML page.
    """
    mode = getattr(settings, "AWS_COST_MODE", "mock").lower()
    is_mock = mode != "real"
    context = {
        "is_mock": is_mock,
        "mode": mode,
        "region": getattr(settings, "AWS_REGION", "ap-south-1"),
        "page_title": "AWS Cost & Usage Monitoring",
    }
    return render(request, "aws_costs/dashboard.html", context)


@api_view(["GET"])
@permission_classes([AllowAny])
def hourly_cost_view(request):
    """
    GET /aws-costs/api/hourly/?hours=24
    """
    try:
        hours = int(request.query_params.get("hours", 24))
        hours = max(1, min(hours, 336))  # Clamp between 1 hour and 14 days (CE hourly max limit)
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        start = now - timedelta(hours=hours)

        provider = get_provider()
        data = provider.get_hourly_cost(start=start, end=now)
        
        return Response({
            "success": True,
            "hours": hours,
            "data": data,
            "results": data.get("ResultsByTime", [])
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in hourly_cost_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to retrieve hourly cost data.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def daily_cost_view(request):
    """
    GET /aws-costs/api/daily/?days=30
    """
    try:
        days = int(request.query_params.get("days", 30))
        days = max(1, min(days, 365))
        now = timezone.now().date()
        start = now - timedelta(days=days)

        provider = get_provider()
        data = provider.get_daily_cost(start=start, end=now)

        return Response({
            "success": True,
            "days": days,
            "data": data,
            "results": data.get("ResultsByTime", [])
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in daily_cost_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to retrieve daily cost trend.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def cost_by_service_view(request):
    """
    GET /aws-costs/api/by-service/?days=7
    """
    try:
        days = int(request.query_params.get("days", 7))
        days = max(1, min(days, 90))
        now = timezone.now().date()
        start = now - timedelta(days=days)

        provider = get_provider()
        data = provider.get_cost_by_service(start=start, end=now)

        return Response({
            "success": True,
            "days": days,
            **data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in cost_by_service_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to retrieve cost by service.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def forecast_view(request):
    """
    GET /aws-costs/api/forecast/
    """
    try:
        provider = get_provider()
        data = provider.get_forecast()

        return Response({
            "success": True,
            **data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in forecast_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to retrieve cost forecast and budget.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def running_services_view(request):
    """
    GET /aws-costs/api/running-services/
    """
    try:
        provider = get_provider()
        resources = provider.get_running_resources()

        return Response({
            "success": True,
            "count": len(resources),
            "resources": resources
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in running_services_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to list running resources.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def integration_health_view(request):
    """
    GET /aws-costs/api/integration-health/
    """
    try:
        provider = get_provider()
        health = provider.get_integration_health()

        return Response({
            "success": True,
            **health
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in integration_health_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to retrieve database integration health.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def summary_view(request):
    """
    GET /aws-costs/api/summary/
    """
    try:
        provider = get_provider()
        summary = provider.get_summary()

        return Response({
            "success": True,
            **summary
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in summary_view: {e}", exc_info=True)
        return Response({
            "success": False,
            "error": "Failed to generate AWS cost summary.",
            "detail": str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
