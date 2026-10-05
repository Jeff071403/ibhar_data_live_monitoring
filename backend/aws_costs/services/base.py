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
        Retrieves hourly cost data across recent hours.
        Matches AWS Cost Explorer GetCostAndUsage response format with Granularity='HOURLY'.
        """
        pass

    @abstractmethod
    def get_daily_cost(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Retrieves daily cost trend.
        Matches AWS Cost Explorer GetCostAndUsage response format with Granularity='DAILY'.
        """
        pass

    @abstractmethod
    def get_cost_by_service(self, start: Optional[datetime] = None, end: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Retrieves cost grouped by AWS Service (EC2, RDS, S3, Lambda, CloudWatch, Data Transfer, etc.).
        Matches AWS Cost Explorer GetCostAndUsage response with GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}].
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
        Lists currently running AWS resources across EC2, RDS, and Lambda.
        """
        pass

    @abstractmethod
    def get_integration_health(self) -> Dict[str, Any]:
        """
        Derives hospital database integration health based on RDS CloudWatch telemetry
        (CPUUtilization, DatabaseConnections, FreeStorageSpace, IOPS/Latency).
        """
        pass

    @abstractmethod
    def get_summary(self) -> Dict[str, Any]:
        """
        Returns high-level summary KPIs (Today's cost, MTD cost, Forecast, Budget %, Top services, RDS health status).
        """
        pass
