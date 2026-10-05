import os
from django.conf import settings
from .base import CostProvider
from .mock_provider import MockCostProvider
from .aws_provider import AWSCostProvider


def get_provider() -> CostProvider:
    """
    Factory function returning the configured CostProvider.
    Reads AWS_COST_MODE from Django settings (default: 'mock').
    """
    mode = getattr(settings, "AWS_COST_MODE", os.getenv("AWS_COST_MODE", "mock")).strip().lower()
    
    if mode in ("real", "aws", "production"):
        return AWSCostProvider()
    
    return MockCostProvider()
