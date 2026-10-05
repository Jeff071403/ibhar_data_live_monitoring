# Deploying to Cloud Run

This project ships as **two separate containers** — a Django API and a static
React SPA served by nginx — because Cloud Run runs one process per service
and Vite's frontend env vars are baked in at build time, not runtime.

## 0. One-time setup

```bash
export PROJECT_ID=your-gcp-project
export REGION=asia-south1        # pick the region closest to you
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

gcloud artifacts repositories create ibhar-repo \
  --repository-format=docker --location=$REGION
```

## 1. Build & deploy the backend first

```bash
cd backend
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/backend

gcloud run deploy ibhar-backend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/backend \
  --region $REGION --allow-unauthenticated \
  --set-env-vars DJANGO_SECRET_KEY=<generate-a-real-secret>,DEBUG=False,DB_ENGINE=sqlite,ALLOWED_HOSTS=*
```

`db.sqlite3` inside a container is **not persistent** across
revisions/restarts — fine for a demo, but for real data switch `DB_ENGINE` to
`postgresql` and point `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` at a
[Cloud SQL](https://cloud.google.com/sql) instance connected via the Cloud
SQL Auth Proxy sidecar or a private VPC connector.

Note the URL Cloud Run prints, e.g. `https://ibhar-backend-xxxxx.a.run.app`.

## 2. Build & deploy the frontend, pointing it at the backend

```bash
cd ../frontend
gcloud builds submit \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/frontend \
  --substitutions=_API_URL=https://ibhar-backend-xxxxx.a.run.app/api \
  --config <(cat <<'EOF'
steps:
  - name: gcr.io/cloud-builders/docker
    args: ['build', '--build-arg', 'VITE_API_BASE_URL=$_API_URL', '-t', '$_IMAGE', '.']
images: ['$_IMAGE']
EOF
) --substitutions=_API_URL=https://ibhar-backend-xxxxx.a.run.app/api,_IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/frontend

gcloud run deploy ibhar-frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/frontend \
  --region $REGION --allow-unauthenticated
```

(If that inline Cloud Build config feels fiddly, it's simpler to build
locally with Docker and push instead — see below.)

## 3. Wire CORS back up

Add the frontend's `*.run.app` URL to the backend's `CORS_ALLOWED_ORIGINS`
(and `CSRF_TRUSTED_ORIGINS` if you use the Django admin) and redeploy:

```bash
gcloud run services update ibhar-backend --region $REGION \
  --update-env-vars CORS_ALLOWED_ORIGINS=https://ibhar-frontend-xxxxx.a.run.app
```

## Alternative: plain Docker build + push

```bash
# backend
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/backend ./backend
docker push $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/backend

# frontend (note the build-arg with your backend's real URL)
docker build \
  --build-arg VITE_API_BASE_URL=https://ibhar-backend-xxxxx.a.run.app/api \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/frontend ./frontend
docker push $REGION-docker.pkg.dev/$PROJECT_ID/ibhar-repo/frontend
```

Then run the two `gcloud run deploy` commands from steps 1 and 2 against
these already-pushed images (omit `gcloud builds submit`).

## Testing locally first

```bash
docker compose up --build
# frontend: http://localhost:8080
# backend:  http://localhost:8000/api/health/
```
