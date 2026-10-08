from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional


class CostProvider(ABC):
    """
    Abstract Base Class defining the contract for AWS Cost & Resource Providers.
    Implementations must return data matching AWS Cost Explorer, Budgets, and CloudWatch structures.
    """

    @abstractmethod
    def get_hourly_cost(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        DEPRECATED: Hourly Cost Explorer API is no longer actively polled by the dashboard
        to eliminate CE invocation costs ($0.01/call).
        Retained for backwards compatibility with legacy callers.
        """
        pass

    @abstractmethod
    def get_daily_cost(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Retrieves daily cost trend (canonical 30-day window, DAILY granularity, grouped by SERVICE).
        This single Cost Explorer query serves as the source of truth for daily spend, MTD, and service breakdown.
        """
        pass

    @abstractmethod
    def get_cost_by_service(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Retrieves cost grouped by AWS Service (EC2, RDS, S3, Lambda, CloudWatch, Data Transfer, etc.).
        Derived by aggregating sliced entries from get_daily_cost to prevent redundant CE API calls.
        """
        pass

    @abstractmethod
    def get_forecast(self) -> Dict[str, Any]:
        """
        Retrieves end-of-month cost forecast and budget metrics.
        Matches AWS Cost Explorer GetCostForecast & AWS Budgets DescribeBudgets formats.
        """
        pass

    @abstractmethod
    def get_running_resources(self) -> List[Dict[str, Any]]:
        """
        Lists currently running AWS resources across EC2 instances and Lambda functions.
        """
        pass

    @abstractmethod
    def get_integration_health(self) -> Dict[str, Any]:
        """
        Derives compute infrastructure health based on EC2 fleet status.
        """
        pass

    @abstractmethod
    def get_summary(self) -> Dict[str, Any]:
        """
        Returns high-level summary KPIs (Today's cost, MTD cost, Forecast, Estimated hourly run-rate,
        Budget %, Top services, EC2 compute fleet status).
        """
        pass
