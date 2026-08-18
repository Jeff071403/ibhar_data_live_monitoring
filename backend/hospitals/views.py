import re
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Hospital, Alert
from .serializers import HospitalSerializer, AlertSerializer

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all().order_by('hospital_id')
    serializer_class = HospitalSerializer

    # Make the hospital_id parameter lookups case-insensitive
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {f"{self.lookup_field}__iexact": self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['post'], url_path='validate')
    def validate_excel(self, request):
        rows = request.data.get('rows', [])
        
        # Calculate the next sequence number by looking up database
        with transaction.atomic():
            last_hosp = Hospital.objects.select_for_update().filter(
                hospital_id__regex=r'^HOSP\d{6}$'
            ).order_by('-hospital_id').first()
            if last_hosp:
                next_seq = int(last_hosp.hospital_id[4:]) + 1
            else:
                next_seq = 1

        results = []
        valid_count = 0
        url_regex = re.compile(r'^https?:\/\/[^\s/$.?#].[^\s]*$', re.IGNORECASE)

        for row in rows:
            errors = []
            hosp_name = row.get('HospitalName', '').strip()
            hosp_type = row.get('HospitalType', '').strip()
            location = row.get('Location', '').strip()
            api_endpoint = row.get('APIEndpoint', '').strip()

            if not hosp_name:
                errors.append('HospitalName is required.')
            if not hosp_type:
                errors.append('HospitalType is required.')
            if not location:
                errors.append('Location is required.')
            if not api_endpoint:
                errors.append('APIEndpoint is required.')
            elif not url_regex.match(api_endpoint):
                errors.append('APIEndpoint must be a valid HTTP/HTTPS URL.')

            is_valid = len(errors) == 0
            generated_id = ''

            if is_valid:
                current_seq = next_seq + valid_count
                generated_id = f"HOSP{current_seq:06d}"
                valid_count += 1

            results.append({
                'row': row,
                'isValid': is_valid,
                'errors': errors,
                'generatedId': generated_id
            })

        return Response({
            'results': results,
            'nextIdSequence': next_seq
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='import')
    def confirm_import(self, request):
        rows = request.data.get('rows', [])
        created_count = 0
        new_hospitals = []

        try:
            with transaction.atomic():
                for row in rows:
                    hosp_name = row.get('HospitalName', '').strip()
                    location = row.get('Location', '').strip()
                    api_endpoint = row.get('APIEndpoint', '').strip()

                    # Perform inline save which triggers sequential safe HOSP ID generator
                    h = Hospital(
                        name=f"{hosp_name}, {location}",
                        city=location,
                        status='healthy',
                        last_data_received='Just now',
                        expected_data_time='12:00 PM',
                        delay_minutes=0,
                        data_frequency=30,
                        data_volume_mb=0,
                        records_received=0,
                        service_status='running',
                        data_quality=100,
                        aws_cost=0,
                        ip_address=api_endpoint.replace('https://', '').replace('http://', '').split('/')[0],
                        region='ap-south-1',
                        api_endpoint=api_endpoint
                    )
                    h.save()
                    new_hospitals.append(h)
                    created_count += 1
            
            serializer = HospitalSerializer(new_hospitals, many=True)
            return Response({
                'message': f'Successfully imported {created_count} hospitals.',
                'hospitals': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Import failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-id')
    serializer_class = AlertSerializer

    @action(detail=True, methods=['post'], url_path='read')
    def mark_as_read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'status': 'alert marked as read'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_analytics(request):
    # Summary of metrics for dashboard views
    hospitals = Hospital.objects.all()
    alerts = Alert.objects.all()

    total_hospitals = hospitals.count()
    healthy = hospitals.filter(status='healthy').count()
    delayed = hospitals.filter(status='delayed').count()
    warning = hospitals.filter(status='warning').count()
    critical = hospitals.filter(status='critical').count()
    offline = hospitals.filter(status='offline').count()

    unread_alerts = alerts.filter(is_read=False).count()

    return Response({
        'totalHospitals': total_hospitals,
        'healthy': healthy,
        'delayed': delayed,
        'warning': warning,
        'critical': critical,
        'offline': offline,
        'unreadAlertsCount': unread_alerts
    }, status=status.HTTP_200_OK)
