from django.test import TestCase
from aws_costs.services.mock_provider import MockCostProvider


class MockCostProviderTests(TestCase):
    def setUp(self):
        self.provider = MockCostProvider(seed=42)

    def test_hourly_cost_structure(self):
        res = self.provider.get_hourly_cost()
        self.assertIn("ResultsByTime", res)
        self.assertTrue(len(res["ResultsByTime"]) > 0)

        first_hour = res["ResultsByTime"][0]
        self.assertIn("TimePeriod", first_hour)
        self.assertIn("Start", first_hour["TimePeriod"])
        self.assertIn("End", first_hour["TimePeriod"])
        self.assertIn("Total", first_hour)
        self.assertIn("UnblendedCost", first_hour["Total"])
        self.assertIn("Amount", first_hour["Total"]["UnblendedCost"])
        self.assertEqual(first_hour["Total"]["UnblendedCost"]["Unit"], "USD")
        self.assertIn("Groups", first_hour)

    def test_daily_cost_structure(self):
        res = self.provider.get_daily_cost()
        self.assertIn("ResultsByTime", res)
        self.assertTrue(len(res["ResultsByTime"]) > 0)

        first_day = res["ResultsByTime"][0]
        self.assertIn("TimePeriod", first_day)
        self.assertIn("Total", first_day)
        amount = float(first_day["Total"]["UnblendedCost"]["Amount"])
        self.assertGreater(amount, 0)

    def test_cost_by_service_structure(self):
        res = self.provider.get_cost_by_service()
        self.assertIn("services", res)
        self.assertIn("total_cost", res)
        self.assertEqual(res["unit"], "USD")
        self.assertTrue(len(res["services"]) > 0)

        # Confirm services are sorted descending by amount
        amounts = [s["amount"] for s in res["services"]]
        self.assertEqual(amounts, sorted(amounts, reverse=True))

    def test_forecast_and_budget_structure(self):
        res = self.provider.get_forecast()
        self.assertIn("Total", res)
        self.assertIn("Budget", res)
        self.assertIn("BudgetLimit", res["Budget"])
        self.assertIn("ActualSpend", res["Budget"])
        self.assertIn("ForecastedSpend", res["Budget"])
        self.assertIn("PercentageUsed", res["Budget"])

    def test_running_resources(self):
        resources = self.provider.get_running_resources()
        self.assertIsInstance(resources, list)
        self.assertTrue(len(resources) >= 4)
        
        types = [r["type"] for r in resources]
        self.assertTrue(any("EC2" in t for t in types))
        self.assertTrue(any("RDS" in t for t in types))
        self.assertTrue(any("Lambda" in t for t in types))

    def test_integration_health(self):
        health = self.provider.get_integration_health()
        self.assertIn("status", health)
        self.assertIn(health["status"], ["healthy", "degraded", "down"])
        self.assertIn("metrics", health)
        self.assertIn("cpu_utilization", health["metrics"])
        self.assertIn("database_connections", health["metrics"])
        self.assertIn("free_storage_space_gb", health["metrics"])

    def test_summary_kpis(self):
        summary = self.provider.get_summary()
        self.assertEqual(summary["mode"], "mock")
        self.assertTrue(summary["is_mock"])
        self.assertGreater(summary["current_hourly_rate"], 0)
        self.assertGreater(summary["today_cost"], 0)
        self.assertGreater(summary["mtd_cost"], 0)
        self.assertIn("top_services", summary)
        self.assertIn("integration_health", summary)
