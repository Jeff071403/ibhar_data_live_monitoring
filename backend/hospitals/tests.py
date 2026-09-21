from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Hospital, Encounter, Discharge, DataIngestionLog, Alert


class HospitalAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Seed test hospital using raw sql or direct model save if managed=False in test db
        Hospital.objects.create(
            hospital_id='HC0001',
            hospital_name='Apollo Hospital, Chennai',
            hospital_code='APOLLO_MAA',
            status='ACTIVE',
            expected_interval_minutes=30
        )

    def test_health_check(self):
        response = self.client.get('/api/health/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])

    def test_get_hospitals_list(self):
        response = self.client.get('/api/hospitals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('data', response.data)

    def test_get_hospital_detail_found(self):
        response = self.client.get('/api/hospitals/HC0001/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data['data']['hospital_id'], 'HC0001')

    def test_get_hospital_detail_404(self):
        response = self.client.get('/api/hospitals/HC9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data.get('success'))
        self.assertEqual(response.data['error']['code'], 'HOSPITAL_NOT_FOUND')

    def test_get_encounters_empty(self):
        response = self.client.get('/api/encounters/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(len(response.data['data']), 0)

    def test_get_discharges_empty(self):
        response = self.client.get('/api/discharges/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(len(response.data['data']), 0)

    def test_get_ingestion_empty(self):
        response = self.client.get('/api/ingestion/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(len(response.data['data']), 0)

    def test_get_alerts_empty(self):
        response = self.client.get('/api/alerts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(len(response.data['data']), 0)

    def test_get_dashboard(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('total_hospitals', response.data['data'])
