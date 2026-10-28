#!/usr/bin/env bash
set -euo pipefail

if ! command -v dotnet >/dev/null 2>&1; then
    curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0
    export PATH="$HOME/.dotnet:$PATH"
fi

if [[ -z "${API_BASE_URL:-}" ]]; then
    echo "Configure API_BASE_URL in the Vercel project environment." >&2
    exit 1
fi

dotnet publish frontend/Client.csproj --configuration Release --output frontend/publish

python3 - "$API_BASE_URL" frontend/publish/wwwroot/appsettings.json <<'PY'
import json
import sys
from urllib.parse import urlparse

api_url = sys.argv[1]
parsed = urlparse(api_url)
if parsed.scheme not in ("http", "https") or not parsed.netloc:
    raise SystemExit("API_BASE_URL must be an absolute HTTP(S) URL.")

settings_path = sys.argv[2]
with open(settings_path, encoding="utf-8") as settings_file:
    settings = json.load(settings_file)
settings["ApiBaseUrl"] = api_url.rstrip("/") + "/"
with open(settings_path, "w", encoding="utf-8") as settings_file:
    json.dump(settings, settings_file)
PY
