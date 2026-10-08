from unittest.mock import patch, MagicMock
from django.core.cache import cache
from django.test import TestCase
from botocore.exceptions import ClientError

from aws_costs.services.aws_provider import AWSCostProvider


class AWSCostProviderTests(TestCase):
    def setUp(self):
        cache.clear()
        self.provider = AWSCostProvider(region_name="ap-south-1")

    @patch("aws_costs.services.aws_provider.boto3.client")
    def test_hourly_cost_deprecated_success(self, mock_boto):
        mock_ce = MagicMock()
        mock_boto.return_value = mock_ce

        mock_ce.get_cost_and_usage.return_value = {
            "ResultsByTime": [
                {
                    "TimePeriod": {"Start": "2026-10-04T12:00:00Z", "End": "2026-10-04T13:00:00Z"},
                    "Total": {"UnblendedCost": {"Amount": "2.50", "Unit": "USD"}},
                    "Groups": [
                        {
                            "Keys": ["Amazon Elastic Compute Cloud - Compute"],
                            "Metrics": {"UnblendedCost": {"Amount": "2.50", "Unit": "USD"}}
                        }
                    ]
                }
            ],
            "NextPageToken": None
        }

        res = self.provider.get_hourly_cost()
        self.assertIn("ResultsByTime", res)
        self.assertEqual(len(res["ResultsByTime"]), 1)
        self.assertEqual(res["ResultsByTime"][0]["Total"]["UnblendedCost"]["Amount"], "2.50")
        mock_ce.get_cost_and_usage.assert_called_once()

    @patch("aws_costs.services.aws_provider.boto3.client")
    def test_daily_cost_computes_group_totals(self, mock_boto):
        mock_ce = MagicMock()
        mock_boto.return_value = mock_ce

        mock_ce.get_cost_and_usage.return_value = {
            "ResultsByTime": [
                {
                    "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                    "Groups": [
                        {
                            "Keys": ["Amazon Elastic Compute Cloud - Compute"],
                            "Metrics": {"UnblendedCost": {"Amount": "40.00", "Unit": "USD"}}
                        },
                        {
                            "Keys": ["Amazon Relational Database Service"],
                            "Metrics": {"UnblendedCost": {"Amount": "35.00", "Unit": "USD"}}
                        }
                    ]
                }
            ],
            "NextPageToken": None
        }

        res = self.provider.get_daily_cost()
        self.assertEqual(len(res["ResultsByTime"]), 1)
        day_entry = res["ResultsByTime"][0]
        self.assertIn("Total", day_entry)
        self.assertEqual(day_entry["Total"]["UnblendedCost"]["Amount"], "75.00")

    @patch("aws_costs.services.aws_provider.boto3.client")
    def test_cost_by_service_slices_daily_without_extra_ce_call(self, mock_boto):
        mock_ce = MagicMock()
        mock_boto.return_value = mock_ce

        mock_ce.get_cost_and_usage.return_value = {
            "ResultsByTime": [
                {
                    "TimePeriod": {"Start": "2026-10-01", "End": "2026-10-02"},
                    "Groups": [
                        {"Keys": ["Amazon EC2"], "Metrics": {"UnblendedCost": {"Amount": "10.00"}}},
                        {"Keys": ["Amazon RDS"], "Metrics": {"UnblendedCost": {"Amount": "20.00"}}}
                    ]
                }
            ],
            "NextPageToken": None
        }

        # get_cost_by_service should call get_daily_cost internally
        res = self.provider.get_cost_by_service()
        self.assertEqual(res["total_cost"], 30.00)
        self.assertEqual(len(res["services"]), 2)
        self.assertEqual(res["services"][0]["service"], "Amazon RDS")
        self.assertEqual(res["services"][0]["amount"], 20.00)
        # Should only have made 1 CE call
        self.assertEqual(mock_ce.get_cost_and_usage.call_count, 1)

    @patch("aws_costs.services.aws_provider.boto3.client")
    def test_running_resources_aggregation(self, mock_boto):
        mock_ec2 = MagicMock()
        mock_lam = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == "ec2":
                return mock_ec2
            if service == "lambda":
                return mock_lam
            return MagicMock()

        mock_boto.side_effect = client_side_effect

        mock_ec2.describe_instances.return_value = {
            "Reservations": [
                {
                    "Instances": [
                        {
                            "InstanceId": "i-test123",
                            "State": {"Name": "running"},
                            "InstanceType": "t4g.xlarge",
                            "Tags": [{"Key": "Name", "Value": "test-node"}],
                            "Placement": {"AvailabilityZone": "ap-south-1a"}
                        }
                    ]
                }
            ]
        }

        mock_lam.list_functions.return_value = {
            "Functions": [
                {
                    "FunctionName": "test-lambda-fn",
                    "FunctionArn": "arn:aws:lambda:test",
                    "Runtime": "python3.12",
                    "MemorySize": 512
                }
            ]
        }

        resources = self.provider.get_running_resources()
        self.assertEqual(len(resources), 2)
        types = [r["type"] for r in resources]
        self.assertIn("EC2 Instance", types)
        self.assertIn("Lambda Function", types)

    @patch("aws_costs.services.aws_provider.boto3.client")
    def test_graceful_error_handling(self, mock_boto):
        mock_ce = MagicMock()
        mock_boto.return_value = mock_ce
        mock_ce.get_cost_and_usage.side_effect = ClientError(
            {"Error": {"Code": "AccessDeniedException", "Message": "Not authorized"}},
            "GetCostAndUsage"
        )

        res = self.provider.get_hourly_cost()
        self.assertEqual(res.get("status"), "error")
        self.assertIn("error", res)
        self.assertEqual(res.get("ResultsByTime"), [])
