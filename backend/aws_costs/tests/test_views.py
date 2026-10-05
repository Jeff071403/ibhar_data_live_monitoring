from django.test import TestCase, Client
from django.urls import reverse


class AwsCostViewsTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_dashboard_page_view(self):
        url = reverse('aws_costs:dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'aws_costs/dashboard.html')
        self.assertContains(response, 'AWS Cost & Usage Monitoring')
        self.assertContains(response, 'MOCK DATA MODE')

    def test_api_hourly(self):
        url = reverse('aws_costs:api-hourly')
        response = self.client.get(url, {'hours': 12})
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertEqual(json_data['hours'], 12)
        self.assertIn('results', json_data)

    def test_api_daily(self):
        url = reverse('aws_costs:api-daily')
        response = self.client.get(url, {'days': 14})
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertEqual(json_data['days'], 14)

    def test_api_by_service(self):
        url = reverse('aws_costs:api-by-service')
        response = self.client.get(url, {'days': 7})
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertIn('services', json_data)
        self.assertIn('total_cost', json_data)

    def test_api_forecast(self):
        url = reverse('aws_costs:api-forecast')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertIn('Budget', json_data)

    def test_api_running_services(self):
        url = reverse('aws_costs:api-running-services')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertIn('resources', json_data)
        self.assertGreater(json_data['count'], 0)

    def test_api_integration_health(self):
        url = reverse('aws_costs:api-integration-health')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertIn('status', json_data)
        self.assertIn('metrics', json_data)

    def test_api_summary(self):
        url = reverse('aws_costs:api-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertEqual(json_data['mode'], 'mock')
        self.assertIn('current_hourly_rate', json_data)
        self.assertIn('today_cost', json_data)
        self.assertIn('mtd_cost', json_data)
