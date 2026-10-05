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
    def test_hourly_cost_success(self, mock_boto):
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
    def test_daily_cost_pagination(self, mock_boto):
        mock_ce = MagicMock()
        mock_boto.return_value = mock_ce

        mock_ce.get_cost_and_usage.side_effect = [
            {
                "ResultsByTime": [{"TimePeriod": {"Start": "2026-09-01", "End": "2026-09-02"}, "Total": {"UnblendedCost": {"Amount": "80.00", "Unit": "USD"}}, "Groups": []}],
                "NextPageToken": "page-2-token"
            },
            {
                "ResultsByTime": [{"TimePeriod": {"Start": "2026-09-02", "End": "2026-09-03"}, "Total": {"UnblendedCost": {"Amount": "85.00", "Unit": "USD"}}, "Groups": []}],
                "NextPageToken": None
            }
        ]

        res = self.provider.get_daily_cost()
        self.assertEqual(len(res["ResultsByTime"]), 2)
        self.assertEqual(mock_ce.get_cost_and_usage.call_count, 2)

    @patch("aws_costs.services.aws_provider.boto3.client")
    def test_running_resources_aggregation(self, mock_boto):
        mock_ec2 = MagicMock()
        mock_rds = MagicMock()
        mock_lam = MagicMock()

        def client_side_effect(service, **kwargs):
            if service == "ec2":
                return mock_ec2
            if service == "rds":
                return mock_rds
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

        mock_rds.describe_db_instances.return_value = {
            "DBInstances": [
                {
                    "DBInstanceIdentifier": "test-rds-db",
                    "DBInstanceStatus": "available",
                    "DBInstanceClass": "db.m6g.xlarge",
                    "Engine": "postgres",
                    "AvailabilityZone": "ap-south-1a"
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
        self.assertEqual(len(resources), 3)
        types = [r["type"] for r in resources]
        self.assertIn("EC2 Instance", types)
        self.assertIn("RDS Instance", types)
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
