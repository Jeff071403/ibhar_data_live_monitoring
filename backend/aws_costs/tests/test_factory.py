from django.test import TestCase, override_settings
from aws_costs.services.factory import get_provider
from aws_costs.services.mock_provider import MockCostProvider
from aws_costs.services.aws_provider import AWSCostProvider


class FactoryTests(TestCase):
    @override_settings(AWS_COST_MODE='mock')
    def test_factory_returns_mock_provider(self):
        provider = get_provider()
        self.assertIsInstance(provider, MockCostProvider)

    @override_settings(AWS_COST_MODE='real')
    def test_factory_returns_real_provider(self):
        provider = get_provider()
        self.assertIsInstance(provider, AWSCostProvider)

    @override_settings(AWS_COST_MODE='invalid_value')
    def test_factory_fallback_to_mock(self):
        provider = get_provider()
        self.assertIsInstance(provider, MockCostProvider)
