import datetime
from unittest.mock import patch, MagicMock
from django.test import TestCase, SimpleTestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from hospitals.live_sync_service import (
    parse_sync_timestamp,
    is_record_idle,
    determine_record_status,
    determine_hospital_status,
    extract_latest_errors,
    aggregate_per_data_structure,
    aggregate_hospital_sync_details,
    fetch_hospital_sync_details,
    get_live_hospital_summary,
    get_live_dashboard,
)


class LiveSyncUnitTests(SimpleTestCase):
    """
    Unit tests for pure aggregation logic and fault tolerance in live_sync_service.
    Does not touch the database.
    """

    def setUp(self):
        self.fixed_now = datetime.datetime(2026, 8, 26, 16, 30, 0, tzinfo=datetime.timezone.utc)

    # 1. SUCCESS record
    def test_single_success_record(self):
        records = [{
            "Code": "1",
            "HospitalCode": "HC2127",
            "HospitalName": "Calcutta Medical Research Institute (CMRI)",
            "DataStructureName": "SURGERY_INFORMATION",
            "RecordsAvailable": 10,
            "RecordsProcessed": 10,
            "StartTime": "2026-08-26T16:15:00",
            "EndTime": "2026-08-26T16:15:05",
            "ErrorText": "",
            "ProcessStatus": "SUCCESS"
        }]
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "healthy")
        self.assertEqual(res["success_count"], 1)
        self.assertEqual(res["error_count"], 0)
        self.assertEqual(res["completeness"], 1.0)
        self.assertEqual(res["last_synced_at"], "2026-08-26T16:15:00")
        self.assertEqual(len(res["latest_errors"]), 0)

    # 2. ERROR record
    def test_single_error_record(self):
        records = [{
            "Code": "2",
            "HospitalCode": "HC2127",
            "HospitalName": "CMRI",
            "DataStructureName": "LAB_RESULTS",
            "RecordsAvailable": 5,
            "RecordsProcessed": 0,
            "StartTime": "2026-08-26T16:20:00",
            "EndTime": "2026-08-26T16:20:05",
            "ErrorText": "Database connection refused by host",
            "ProcessStatus": "ERROR"
        }]
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["success_count"], 0)
        self.assertEqual(res["error_count"], 1)
        self.assertEqual(len(res["latest_errors"]), 1)
        self.assertEqual(res["latest_errors"][0]["error_text"], "Database connection refused by host")
        self.assertEqual(res["latest_errors"][0]["data_structure"], "LAB_RESULTS")

    # 3. IDLE record
    def test_idle_record(self):
        records = [{
            "Code": "3",
            "HospitalCode": "HC2127",
            "HospitalName": "CMRI",
            "DataStructureName": "",
            "RecordsAvailable": 0,
            "RecordsProcessed": 0,
            "StartTime": "2026-08-26T16:00:00",
            "EndTime": "2026-08-26T16:00:00",
            "ErrorText": "",
            "ProcessStatus": "SUCCESS"
        }]
        self.assertTrue(is_record_idle(records[0]))
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "idle")
        self.assertEqual(res["completeness"], 1.0)

    # 4. Empty response
    def test_empty_records_response(self):
        res = aggregate_hospital_sync_details("HC2127", [], expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "idle")
        self.assertEqual(res["success_count"], 0)
        self.assertEqual(res["error_count"], 0)
        self.assertEqual(res["completeness"], 1.0)
        self.assertIsNone(res["last_synced_at"])

    # 5. Multiple records
    def test_multiple_records_aggregation(self):
        records = [
            {
                "HospitalCode": "HC2127",
                "DataStructureName": "ENCOUNTER",
                "RecordsAvailable": 10,
                "RecordsProcessed": 10,
                "StartTime": "2026-08-26T16:10:00",
                "ProcessStatus": "SUCCESS"
            },
            {
                "HospitalCode": "HC2127",
                "DataStructureName": "DISCHARGE",
                "RecordsAvailable": 20,
                "RecordsProcessed": 20,
                "StartTime": "2026-08-26T16:20:00",
                "ProcessStatus": "SUCCESS"
            }
        ]
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "healthy")
        self.assertEqual(res["success_count"], 2)
        self.assertEqual(res["last_synced_at"], "2026-08-26T16:20:00")
        self.assertEqual(res["completeness"], 1.0)

    # 6. Multiple data structures
    def test_multiple_data_structures(self):
        records = [
            {
                "HospitalCode": "HC2127",
                "DataStructureName": "SURGERY",
                "RecordsAvailable": 4,
                "RecordsProcessed": 4,
                "StartTime": "2026-08-26T16:15:00",
                "ProcessStatus": "SUCCESS"
            },
            {
                "HospitalCode": "HC2127",
                "DataStructureName": "PHARMACY",
                "RecordsAvailable": 10,
                "RecordsProcessed": 0,
                "StartTime": "2026-08-26T16:25:00",
                "ErrorText": "Endpoint unreachable",
                "ProcessStatus": "ERROR"
            }
        ]
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "error")
        self.assertEqual(len(res["per_data_structure"]), 2)
        structures = {ds["name"]: ds["status"] for ds in res["per_data_structure"]}
        self.assertEqual(structures["SURGERY"], "healthy")
        self.assertEqual(structures["PHARMACY"], "error")

    # 7. Multiple hospitals
    @patch("hospitals.live_sync_service.fetch_hospital_sync_details")
    def test_multiple_hospitals_dashboard(self, mock_fetch):
        recent_time = timezone.now().strftime("%Y-%m-%dT%H:%M:%S")
        def side_effect(hospital_code, **kwargs):
            if hospital_code == "HC0001":
                return True, [{
                    "HospitalCode": "HC0001",
                    "HospitalName": "Hospital A",
                    "DataStructureName": "TEST",
                    "RecordsAvailable": 5,
                    "RecordsProcessed": 5,
                    "StartTime": recent_time,
                    "ProcessStatus": "SUCCESS"
                }], None
            else:
                return True, [{
                    "HospitalCode": "HC0002",
                    "HospitalName": "Hospital B",
                    "DataStructureName": "TEST",
                    "RecordsAvailable": 5,
                    "RecordsProcessed": 0,
                    "StartTime": recent_time,
                    "ErrorText": "HL7 Parse error",
                    "ProcessStatus": "ERROR"
                }], None

        mock_fetch.side_effect = side_effect
        dashboard = get_live_dashboard(hospital_codes=["HC0001", "HC0002"])
        self.assertEqual(dashboard["hospital_count"], 2)
        self.assertEqual(dashboard["hospitals"][0]["status"], "healthy")
        self.assertEqual(dashboard["hospitals"][1]["status"], "error")


    # 8. RecordsAvailable = 0 (no division by zero)
    def test_zero_records_available_completeness(self):
        records = [{
            "HospitalCode": "HC2127",
            "DataStructureName": "EMPTY_TEST",
            "RecordsAvailable": 0,
            "RecordsProcessed": 0,
            "StartTime": "2026-08-26T16:20:00",
            "ProcessStatus": "SUCCESS"
        }]
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["completeness"], 1.0)

    # 9. RecordsProcessed < RecordsAvailable
    def test_partial_processed_completeness(self):
        records = [{
            "HospitalCode": "HC2127",
            "DataStructureName": "PARTIAL",
            "RecordsAvailable": 100,
            "RecordsProcessed": 75,
            "StartTime": "2026-08-26T16:20:00",
            "ProcessStatus": "SUCCESS"
        }]
        res = aggregate_hospital_sync_details("HC2127", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["completeness"], 0.75)

    # 10. Latest StartTime selection
    def test_latest_start_time_selection(self):
        records = [
            {"HospitalCode": "HC1", "DataStructureName": "A", "RecordsAvailable": 1, "RecordsProcessed": 1, "StartTime": "2026-08-26T12:00:00", "ProcessStatus": "SUCCESS"},
            {"HospitalCode": "HC1", "DataStructureName": "B", "RecordsAvailable": 1, "RecordsProcessed": 1, "StartTime": "2026-08-26T15:00:00", "ProcessStatus": "SUCCESS"},
            {"HospitalCode": "HC1", "DataStructureName": "C", "RecordsAvailable": 1, "RecordsProcessed": 1, "StartTime": "2026-08-26T14:00:00", "ProcessStatus": "SUCCESS"},
        ]
        res = aggregate_hospital_sync_details("HC1", records, expected_interval_minutes=300, now_dt=self.fixed_now)
        self.assertEqual(res["last_synced_at"], "2026-08-26T15:00:00")

    # 11. Delayed status
    def test_delayed_status_calculation(self):
        # 16:30 now - 15:00 sync = 90 min delay > 30 min expected
        records = [{
            "HospitalCode": "HC1",
            "DataStructureName": "SURGERY",
            "RecordsAvailable": 5,
            "RecordsProcessed": 5,
            "StartTime": "2026-08-26T15:00:00",
            "ProcessStatus": "SUCCESS"
        }]
        res = aggregate_hospital_sync_details("HC1", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "delayed")

    # 12. Error status overrides delay
    def test_error_status_priority(self):
        records = [
            {"HospitalCode": "HC1", "DataStructureName": "A", "RecordsAvailable": 5, "RecordsProcessed": 5, "StartTime": "2026-08-26T16:25:00", "ProcessStatus": "SUCCESS"},
            {"HospitalCode": "HC1", "DataStructureName": "B", "RecordsAvailable": 5, "RecordsProcessed": 0, "StartTime": "2026-08-26T16:25:00", "ErrorText": "Failed", "ProcessStatus": "ERROR"},
        ]
        res = aggregate_hospital_sync_details("HC1", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "error")

    # 13. Idle status
    def test_idle_status_all_idle_records(self):
        records = [
            {"HospitalCode": "HC1", "DataStructureName": "", "RecordsAvailable": 0, "RecordsProcessed": 0, "StartTime": "2026-08-26T10:00:00", "ProcessStatus": "SUCCESS"},
            {"HospitalCode": "HC1", "DataStructureName": "", "RecordsAvailable": 0, "RecordsProcessed": 0, "StartTime": "2026-08-26T11:00:00", "ProcessStatus": "SUCCESS"},
        ]
        res = aggregate_hospital_sync_details("HC1", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["status"], "idle")

    # 14. Completeness calculation across multiple entries
    def test_completeness_calculation(self):
        records = [
            {"HospitalCode": "HC1", "DataStructureName": "A", "RecordsAvailable": 50, "RecordsProcessed": 50, "ProcessStatus": "SUCCESS"},
            {"HospitalCode": "HC1", "DataStructureName": "B", "RecordsAvailable": 50, "RecordsProcessed": 25, "ProcessStatus": "SUCCESS"},
        ]
        res = aggregate_hospital_sync_details("HC1", records, expected_interval_minutes=30, now_dt=self.fixed_now)
        self.assertEqual(res["completeness"], 0.75)

    # 15. Error extraction with sorting and exact error text
    def test_error_extraction_preservation(self):
        records = [
            {"HospitalCode": "HC1", "DataStructureName": "A", "ErrorText": "Old error", "StartTime": "2026-08-26T12:00:00", "ProcessStatus": "ERROR"},
            {"HospitalCode": "HC1", "DataStructureName": "B", "ErrorText": "Latest critical failure: timeout", "StartTime": "2026-08-26T16:00:00", "ProcessStatus": "ERROR"},
        ]
        errors = extract_latest_errors(records, limit=10)
        self.assertEqual(len(errors), 2)
        self.assertEqual(errors[0]["error_text"], "Latest critical failure: timeout")
        self.assertEqual(errors[0]["data_structure"], "B")

    # 16. Malformed/missing timestamp handling
    def test_malformed_missing_timestamp(self):
        self.assertIsNone(parse_sync_timestamp(None))
        self.assertIsNone(parse_sync_timestamp(""))
        self.assertIsNone(parse_sync_timestamp("invalid-date-format"))
        
        parsed = parse_sync_timestamp("2026-08-26T16:00:43")
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.year, 2026)

    # 17. API failure behavior (network timeout, HTTP 500, etc.)
    @patch("requests.get")
    def test_api_network_failure_handling(self, mock_get):
        import requests
        mock_get.side_effect = requests.exceptions.Timeout("Connection timed out after 15s")
        success, data, err = fetch_hospital_sync_details("HC2127", api_url="https://dummy:44382/api", user_code="USER1")
        self.assertFalse(success)
        self.assertIsNone(data)
        self.assertIn("timeout", err.lower())

        summary = get_live_hospital_summary("HC2127", api_url="https://dummy:44382/api", user_code="USER1")
        self.assertEqual(summary["status"], "error")
        self.assertEqual(len(summary["latest_errors"]), 1)
        self.assertIn("timeout", summary["latest_errors"][0]["error_text"].lower())


class LiveViewsAPITests(TestCase):
    """
    Tests the DRF Live API endpoints:
    GET /api/live/dashboard/
    GET /api/live/hospitals/<str:code>/
    """

    def setUp(self):
        self.client = APIClient()

    @patch("hospitals.live_sync_service.fetch_hospital_sync_details")
    def test_get_live_dashboard_endpoint(self, mock_fetch):
        mock_fetch.return_value = (True, [
            {
                "HospitalCode": "HC2127",
                "HospitalName": "Calcutta Medical Research Institute (CMRI)",
                "DataStructureName": "SURGERY_INFORMATION",
                "RecordsAvailable": 2,
                "RecordsProcessed": 2,
                "StartTime": timezone.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "EndTime": timezone.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "ErrorText": "",
                "ProcessStatus": "SUCCESS"
            }
        ], None)

        response = self.client.get('/api/live/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('hospitals', response.data)
        self.assertGreaterEqual(response.data['hospital_count'], 1)

    @patch("hospitals.live_sync_service.fetch_hospital_sync_details")
    def test_get_live_hospital_endpoint(self, mock_fetch):
        mock_fetch.return_value = (True, [
            {
                "HospitalCode": "HC2127",
                "HospitalName": "CMRI",
                "DataStructureName": "GENERAL",
                "RecordsAvailable": 1,
                "RecordsProcessed": 1,
                "StartTime": timezone.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "ProcessStatus": "SUCCESS"
            }
        ], None)

        response = self.client.get('/api/live/hospitals/HC2127/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data['hospital_code'], 'HC2127')
        self.assertEqual(response.data['status'], 'healthy')
