#!/bin/bash

# GitHub Flow Branch Protection Setup Script
# This script sets up branch protection rules for the main branch

set -e

echo "🔒 Setting up GitHub Flow branch protection rules..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run:"
    echo "   gh auth login"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"

# Set up branch protection for main branch
echo "🛡️  Setting up branch protection for 'main' branch..."

gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["website","extension","backend","security"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions='{"users":[],"teams":[],"apps":[]}' \
  --field allow_force_pushes=false \
  --field allow_deletions=false

echo "✅ Branch protection rules set up successfully!"

# Display current protection rules
echo "📋 Current branch protection rules:"
gh api repos/$REPO/branches/main/protection | jq '{
  required_status_checks: .required_status_checks,
  enforce_admins: .enforce_admins,
  required_pull_request_reviews: .required_pull_request_reviews,
  restrictions: .restrictions,
  allow_force_pushes: .allow_force_pushes,
  allow_deletions: .allow_deletions
}'

echo ""
echo "🎉 GitHub Flow setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Review the branch protection rules above"
echo "2. Test the workflow by creating a feature branch"
echo "3. Create a pull request to verify the protection works"
echo "4. Update team members about the new workflow"
echo ""
echo "📖 Documentation:"
echo "- GitHub Flow guide: .github/GITHUB_FLOW.md"
echo "- Cursor rules: .cursorrules"
echo "- PR template: .github/pull_request_template.md"
