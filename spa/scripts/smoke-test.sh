#!/bin/bash
set -e

WEBSITE_URL=${1:-$WEBSITE_URL}

if [ -z "$WEBSITE_URL" ]; then
  echo "Error: WEBSITE_URL not provided"
  exit 1
fi

echo "Running smoke tests against: $WEBSITE_URL"

# Test 1: Check if website is accessible
echo "Testing website accessibility..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL")
if [ "$response" != "200" ]; then
  echo "❌ Website not accessible. HTTP status: $response"
  exit 1
fi
echo "✅ Website is accessible"

# Test 2: Check if essential content loads
echo "Testing essential content..."
content=$(curl -s "$WEBSITE_URL")
if [[ ! "$content" =~ "<title>" ]]; then
  echo "❌ No title tag found"
  exit 1
fi
echo "✅ Essential content loads"

# Test 3: Check if static assets load (basic check)
echo "Testing static assets..."
if [[ "$content" =~ "src=\"" ]] || [[ "$content" =~ "href=\"" ]]; then
  echo "✅ Static assets referenced"
else
  echo "⚠️  No static assets found (may be expected for some SPAs)"
fi

echo "🎉 All smoke tests passed!"
