from django.contrib.auth.models import User
from django.test import TestCase, Client, override_settings
from django.urls import reverse
from aws_costs.models import AwsCostSnapshot


@override_settings(AWS_COST_MODE='mock')
class AwsCostViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testadmin", password="password123", is_staff=True)

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


@override_settings(AWS_COST_MODE='real')
class AwsCostRealSnapshotViewsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testadmin", password="password123", is_staff=True)
        # Create a mock DB snapshot to simulate real mode without CE calls
        self.snapshot = AwsCostSnapshot.objects.create(
            payload={
                "daily": {
                    "ResultsByTime": [
                        {
                            "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                            "Total": {"UnblendedCost": {"Amount": "50.00", "Unit": "USD"}},
                            "Groups": [{"Keys": ["EC2"], "Metrics": {"UnblendedCost": {"Amount": "50.00", "Unit": "USD"}}}]
                        }
                    ]
                },
                "by_service_7d": {
                    "services": [{"service": "EC2", "amount": 50.0, "percentage": 100.0}],
                    "total_cost": 50.0
                },
                "forecast": {
                    "Total": {"Amount": "1500.00", "Unit": "USD"},
                    "Budget": {"BudgetLimit": {"Amount": "2500.00"}, "ActualSpend": {"Amount": "50.00"}}
                },
                "resources": [{"type": "EC2 Instance", "id": "i-test", "state": "running"}],
                "health": {"status": "healthy", "metrics": {}},
                "summary": {
                    "mode": "real",
                    "today_cost": 50.00,
                    "mtd_cost": 50.00,
                    "current_hourly_rate": 2.08,
                    "integration_health": "healthy"
                },
                "last_updated": "2026-10-08 00:00:00 UTC"
            },
            status="success",
            source="test"
        )

    def test_daily_view_reads_snapshot_in_real_mode(self):
        url = reverse('aws_costs:api-daily')
        response = self.client.get(url, {'days': 30})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['Total']['UnblendedCost']['Amount'], "50.00")
        self.assertIn('fetched_at', data)

    def test_force_refresh_auth_required(self):
        url = reverse('aws_costs:api-refresh')
        # Unauthenticated request should be rejected (401 / 403)
        response = self.client.post(url)
        self.assertIn(response.status_code, [401, 403])

    def test_force_refresh_cooldown(self):
        url = reverse('aws_costs:api-refresh')
        self.client.force_login(self.user)
        # Since self.snapshot was created just now, cooldown should reject with 429
        response = self.client.post(url)
        self.assertEqual(response.status_code, 429)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('cooldown', data['error'].lower())
