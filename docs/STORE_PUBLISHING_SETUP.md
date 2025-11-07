# Browser Extension Store Publishing Setup Guide

This guide explains how to obtain API credentials for publishing Rolodink extensions to Chrome Web Store, Firefox Add-ons Store (AMO), and Microsoft Edge Add-ons Store.

## Overview

The release workflow automatically publishes extensions to all three stores when a release tag is created (e.g., `v1.0.4`). All credentials must be configured as GitHub Secrets.

## Chrome Web Store

### Required Secrets

- `CHROME_CLIENT_ID` - OAuth2 Client ID from Google Cloud Console
- `CHROME_CLIENT_SECRET` - OAuth2 Client Secret
- `CHROME_REFRESH_TOKEN` - OAuth2 Refresh Token
- `CHROME_EXTENSION_ID` - Chrome Web Store Extension ID

### Setup Steps

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Chrome Web Store API:**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Chrome Web Store API"
   - Click "Enable"

3. **Create OAuth2 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `https://www.googleapis.com/auth/chromewebstore`
   - Save the Client ID and Client Secret

4. **Get Refresh Token:**
   - Use a tool like [Chrome Web Store API OAuth Tool](https://github.com/fregante/chrome-web-store-upload/blob/main/How%20to%20generate%20Google%20API%20keys.md) or:
   - Visit: `https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob`
   - Replace `YOUR_CLIENT_ID` with your actual Client ID
   - Authorize and copy the authorization code
   - Exchange the code for a refresh token using the OAuth2 API

5. **Get Extension ID:**
   - Upload your extension to Chrome Web Store Developer Dashboard (first time)
   - The Extension ID is displayed in the dashboard (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

6. **Configure GitHub Secrets:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add all four secrets with the values obtained above

## Firefox Add-ons Store (AMO)

### Required Secrets

- `FIREFOX_JWT_ISSUER` - AMO JWT Issuer (same as existing `AMO_JWT_ISSUER`)
- `FIREFOX_JWT_SECRET` - AMO JWT Secret (same as existing `AMO_JWT_SECRET`)

### Setup Steps

1. **Create AMO Developer Account:**
   - Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
   - Sign in with your Firefox account
   - Complete developer registration if needed

2. **Generate API Credentials:**
   - Navigate to "Manage My Submissions" → "Developer Hub" → "API Credentials"
   - Click "Generate new credentials"
   - Save the JWT Issuer and JWT Secret

3. **Configure GitHub Secrets:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add `FIREFOX_JWT_ISSUER` with the JWT Issuer value
   - Add `FIREFOX_JWT_SECRET` with the JWT Secret value

**Note:** The workflow uses these secrets for both signing (existing) and publishing (new). You can reuse existing `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` secrets if they're already configured.

## Microsoft Edge Add-ons Store

### Required Secrets

- `EDGE_CLIENT_ID` - Microsoft Azure AD Client ID
- `EDGE_CLIENT_SECRET` - Microsoft Azure AD Client Secret
- `EDGE_ACCESS_TOKEN` - Microsoft Azure AD Access Token
- `EDGE_PRODUCT_ID` - Edge Add-ons Store Product ID

### Setup Steps

1. **Create Azure AD Application:**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: "Rolodink Extension Publishing"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Leave blank for now
   - Click "Register"

2. **Create Client Secret:**
   - In your app registration, go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "GitHub Actions Publishing"
   - Expires: Choose appropriate expiration (recommend 24 months)
   - Click "Add" and **copy the secret value immediately** (it won't be shown again)

3. **Get Access Token:**
   - Use the Microsoft Graph API or Azure CLI to get an access token
   - The token needs the `PartnerCenter.ReadWrite` permission
   - You may need to use a service principal or delegate permissions

4. **Get Product ID:**
   - Upload your extension to Edge Add-ons Partner Center (first time)
   - The Product ID is displayed in the Partner Center dashboard

5. **Configure GitHub Secrets:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add all four secrets with the values obtained above

**Note:** Edge publishing may require additional setup in the Partner Center. Refer to [Microsoft Edge Add-ons documentation](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/extension-publishing) for latest requirements.

## Verification

After configuring all secrets, test the workflow by:

1. Creating a test release tag (e.g., `v1.0.4-test`)
2. Pushing the tag: `git tag v1.0.4-test && git push origin v1.0.4-test`
3. Monitoring the GitHub Actions workflow run
4. Checking each store's developer dashboard for the new version

## Troubleshooting

### Chrome Web Store

- **"Invalid client"**: Verify Client ID and Client Secret are correct
- **"Invalid refresh token"**: Regenerate the refresh token
- **"Version must be higher"**: Ensure manifest.json version is incremented
- **"Extension not found"**: Verify Extension ID matches the one in Chrome Web Store

### Firefox AMO

- **"Invalid credentials"**: Verify JWT Issuer and Secret are correct
- **"Not authorized"**: Ensure your AMO account has publishing permissions
- **"Version conflict"**: Ensure manifest-firefox.json version is incremented

### Microsoft Edge

- **"Invalid client"**: Verify Client ID and Secret are correct
- **"Invalid access token"**: Regenerate the access token with correct permissions
- **"Product not found"**: Verify Product ID matches the one in Partner Center

## Security Notes

- Never commit secrets to the repository
- Rotate secrets regularly (especially access tokens)
- Use different credentials for development and production if needed
- Monitor GitHub Actions logs for any exposed credentials (they should be masked)

## References

- [Chrome Web Store API Documentation](https://developer.chrome.com/docs/webstore/api/)
- [Firefox AMO API Documentation](https://addons-server.readthedocs.io/en/latest/topics/api/index.html)
- [Microsoft Edge Add-ons Publishing](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/extension-publishing)

