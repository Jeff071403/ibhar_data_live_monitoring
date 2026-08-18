from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HospitalViewSet, AlertViewSet, get_analytics

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'alerts', AlertViewSet, basename='alert')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/summary/', get_analytics, name='analytics_summary'),
]
