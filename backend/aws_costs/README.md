# AWS Cost & Usage Monitoring Dashboard (`aws_costs`)

The `aws_costs` app provides real-time visibility into cloud infrastructure expenditures, hourly burn rates, service breakdown, active running resources, and RDS integration telemetry for the IBHAR Hospital Monitoring Platform.

---

## 🚀 Key Capabilities
- **Wall Display Dashboard**: High-contrast, large typography dashboard with 60-second automatic polling at `/aws-costs/`.
- **Granular Cost Insights**:
  - 24-Hour Hourly Cost Timeline with peak/average burn detection
  - 30-Day Daily Spend Trend
  - Cost categorized by AWS Service (EC2, RDS, S3, Lambda, CloudWatch, Data Transfer)
  - Month-End Machine Learning Forecast & Budget tracking
- **Active Infrastructure Inventory**: Lists running EC2 instances, RDS databases, and Lambda functions.
- **Hospital Database Integration Health**: Real-time CloudWatch telemetry for CPU utilization, database connections, and storage capacity.
- **Cost Explorer Fee Optimization**: Built-in Django caching layer minimizes Cost Explorer API call fees ($0.01 per request).

---

## 🛠️ How to Run in Mock Mode (Default)
By default, the application runs in **Mock Mode**, generating realistic, stable telemetry and diurnal cost patterns without contacting AWS:

1. Start the Django backend:
   ```bash
   python manage.py runserver 8000
   ```
2. Navigate to:
   - **Dashboard UI**: [http://localhost:8000/aws-costs/](http://localhost:8000/aws-costs/)
   - **REST Summary API**: [http://localhost:8000/aws-costs/api/summary/](http://localhost:8000/aws-costs/api/summary/)

---

## ⚡ How to Switch to Real AWS Mode

1. Configure environment variables in `backend/.env`:
   ```env
   AWS_COST_MODE=real
   AWS_REGION=ap-south-1
   AWS_COST_RDS_INSTANCE_ID=ibhar-prod-postgres-db

   # Optional cache tuning (seconds)
   AWS_COST_CACHE_TTL_HOURLY=900
   AWS_COST_CACHE_TTL_DAILY=21600
   ```

2. Provide AWS credentials using the standard boto3 credential chain:
   - **IAM Instance Profile / ECS / Cloud Run Service Account** (Recommended for Production)
   - Or standard environment variables:
     ```env
     AWS_ACCESS_KEY_ID=your-access-key-id
     AWS_SECRET_ACCESS_KEY=your-secret-access-key
     ```

3. Restart the Django server.

---

## 🔒 Minimum Read-Only IAM Policy

Attach the following least-privilege IAM policy to the role/user running the application:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CostAndBudgetsReadOnly",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "budgets:ViewBudget"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMetricsReadOnly",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "InfrastructureInventoryReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "rds:DescribeDBInstances",
        "lambda:ListFunctions"
      ],
      "Resource": "*"
    }
  ]
}
```

> **Note on Cost Explorer Hourly Data**:
> To query hourly granularity in Cost Explorer, ensure that **"Hourly and Resource-Level Data"** is enabled in the AWS Cost Management Console settings.

---

## 📡 REST API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/aws-costs/` | `GET` | Main Wall Display Dashboard HTML Page |
| `/aws-costs/api/summary/` | `GET` | Summary KPIs (Hourly burn, Today's spend, MTD, Forecast, Budget %, DB Health) |
| `/aws-costs/api/hourly/?hours=24` | `GET` | Hourly Cost Explorer results |
| `/aws-costs/api/daily/?days=30` | `GET` | Daily Cost Explorer results |
| `/aws-costs/api/by-service/?days=7`| `GET` | Spend grouped by AWS service |
| `/aws-costs/api/forecast/` | `GET` | Month-end projection and budget consumption |
| `/aws-costs/api/running-services/` | `GET` | Inventory of active EC2, RDS, and Lambda instances |
| `/aws-costs/api/integration-health/`| `GET`| RDS CloudWatch metrics and integration status |
