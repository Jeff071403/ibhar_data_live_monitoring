# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install Python deps directly (all dependencies have prebuilt wheels)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the rest of the backend source
COPY . .

# Collect static files at build time (admin + drf-spectacular swagger assets).
# Dummy values are fine here: they're only needed for Django's settings
# module to import without error, not for the actual runtime config.
RUN DJANGO_SECRET_KEY=build-time-key DEBUG=False DB_ENGINE=sqlite \
    python manage.py collectstatic --noinput

# Cloud Run injects PORT (default 8080); gunicorn reads it at container start.
ENV PORT=8080
EXPOSE 8080

# Run database migrations then start gunicorn. Cloud Run only sends traffic
# once the container is listening, so doing migrations here is fine for a
# single-instance / low-concurrency deployment. For multiple instances,
# move `migrate` into a separate CI/CD or Cloud Run Job step instead.
CMD python manage.py migrate --noinput && \
    exec gunicorn backend_project.wsgi:application \
        --bind 0.0.0.0:${PORT} \
        --workers 2 \
        --threads 4 \
        --timeout 180
