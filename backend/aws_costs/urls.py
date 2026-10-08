from django.urls import path
from .views import (
    dashboard_page_view,
    hourly_cost_view,
    daily_cost_view,
    cost_by_service_view,
    forecast_view,
    running_services_view,
    integration_health_view,
    summary_view,
    force_refresh_view,
)

app_name = 'aws_costs'

urlpatterns = [
    # Dashboard HTML Page
    path('', dashboard_page_view, name='dashboard'),

    # REST JSON APIs
    path('api/hourly/', hourly_cost_view, name='api-hourly'),
    path('api/daily/', daily_cost_view, name='api-daily'),
    path('api/by-service/', cost_by_service_view, name='api-by-service'),
    path('api/forecast/', forecast_view, name='api-forecast'),
    path('api/running-services/', running_services_view, name='api-running-services'),
    path('api/integration-health/', integration_health_view, name='api-integration-health'),
    path('api/summary/', summary_view, name='api-summary'),
    path('api/refresh/', force_refresh_view, name='api-refresh'),
]
