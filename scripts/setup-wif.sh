#!/bin/bash

# Configuration variables
export PROJECT_ID="rolodink"
export APP_NAME="rolodink-extension"
export GITHUB_REPO="thijsmat/rolodink" # Format: user/repo

echo "🚀 Starting Workload Identity Federation (WIF) setup for project: ${PROJECT_ID}..."

# 1. Enable Cloud Identity-Aware Proxy API (often needed for WIF/IAM)
# gcloud services enable iamcredentials.googleapis.com --project "${PROJECT_ID}"

# 2. Service Account aanmaken (de identiteit die de acties uitvoert)
echo "👤 Creating Service Account: ${APP_NAME}-sa..."
gcloud iam service-accounts create "${APP_NAME}-sa" \
  --project "${PROJECT_ID}" \
  --display-name "GitHub Actions Service Account"

# 3. Workload Identity Pool aanmaken
echo "🌊 Creating Workload Identity Pool: ${APP_NAME}-pool..."
gcloud iam workload-identity-pools create "${APP_NAME}-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 4. Provider aanmaken (Koppeling met GitHub)
echo "🔗 Creating Workload Identity Provider: ${APP_NAME}-provider..."
gcloud iam workload-identity-pools providers create-oidc "${APP_NAME}-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${APP_NAME}-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 5. De GitHub Repo toegang geven tot de Service Account
echo "🔐 Granting repository ${GITHUB_REPO} access to the Service Account..."
export WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe "${APP_NAME}-pool" --project="${PROJECT_ID}" --location="global" --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding "${APP_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${GITHUB_REPO}"

# 6. Output voor je GitHub Action configuratie
echo ""
echo "✅ Setup complete! Use these values in your GitHub Action YAML:"
echo "------------------------------------------------------------"
echo "workload_identity_provider: projects/$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")/locations/global/workloadIdentityPools/${APP_NAME}-pool/providers/${APP_NAME}-provider"
echo "service_account: ${APP_NAME}-sa@${PROJECT_ID}.iam.gserviceaccount.com"
echo "------------------------------------------------------------"
