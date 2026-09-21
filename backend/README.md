# IBHAR Live Hospital Data Monitoring — Django REST Backend

High-performance Django REST Framework API connected to Supabase PostgreSQL database for live hospital telemetry, encounters, discharges, ingestion logs, and alerting monitoring.

---

## 🛠️ Tech Stack
- **Framework**: Python 3.10+, Django 5.x, Django REST Framework
- **Database**: Supabase PostgreSQL (`psycopg2-binary` / `psycopg`) with `managed=False` models
- **Documentation**: OpenAPI 3.0 via `drf-spectacular` & Swagger UI
- **CORS**: `django-cors-headers`

---

## 📁 Architecture Overview

```
backend/
├── manage.py
├── backend_project/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── hospitals/
│   ├── models.py       # Django models mapped to Supabase PostgreSQL tables
│   ├── serializers.py  # DRF Serializers
│   ├── views.py        # APIViews for Hospitals, Encounters, Discharges, Ingestion & Alerts
│   ├── services.py     # Aggregation & hospital status calculation logic
│   ├── urls.py         # REST Endpoint routes
│   └── tests.py        # API Unit tests
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Development Quickstart

### 1. Create & Activate Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and populate your Supabase PostgreSQL credentials:
```ini
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True

DB_ENGINE=postgresql
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_HOST=your_supabase_host
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Run Development Server
```powershell
python manage.py runserver 0.0.0.0:8000
```

---

## 🔌 API Endpoints Reference

Base URL: `http://localhost:8000/api/`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health/` | Health check & DB connectivity status |
| `GET` | `/api/hospitals/` | List, search & filter hospitals |
| `GET` | `/api/hospitals/<hospital_id>/` | Hospital summary & ingestion details |
| `GET` | `/api/hospitals/comparison/` | Cross-hospital performance comparison |
| `GET` | `/api/encounters/` | Filterable encounters list |
| `GET` | `/api/encounters/<id>/` | Encounter details |
| `GET` | `/api/discharges/` | Filterable discharges list |
| `GET` | `/api/discharges/<id>/` | Discharge details |
| `GET` | `/api/ingestion/` | Telemetry data ingestion logs |
| `GET` | `/api/ingestion/latest/<hospital_id>/` | Latest ingestion record for a hospital |
| `GET` | `/api/alerts/` | System alerts list |
| `GET` | `/api/alerts/<id>/` | Alert details |
| `PATCH` | `/api/alerts/<id>/` | Update alert status (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`) |
| `GET` | `/api/dashboard/` | Executive dashboard KPI summary |
| `GET` | `/api/analytics/` | Database trends & metric series |
| `GET` | `/api/docs/` | Interactive Swagger UI API documentation |
| `GET` | `/api/schema/` | OpenAPI 3.0 Schema |
