#!/usr/bin/env python3
"""Build a deployable cPanel payload without bundling binary assets."""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "cpanel_public_html"

HTACCESS_CONTENT = """\
# Redirect HTTP to HTTPS (avoid proxy loops with X-Forwarded-Proto)
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteRule ^api/subscribe$ api/subscribe.php [L]
</IfModule>

# Disable directory listing
Options -Indexes

# Enable gzip compression when available
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

# Cache static assets aggressively
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/jpeg "access plus 6 months"
ExpiresByType image/png "access plus 6 months"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
</IfModule>

<IfModule mod_headers.c>
<FilesMatch "\\.(?:ico|jpe?g|png|css|js)$">
  Header set Cache-Control "public, max-age=2592000, immutable"
</FilesMatch>
</IfModule>
"""


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def copy_text_files() -> None:
    ensure_dir(TARGET)
    shutil.copy2(ROOT / "index.html", TARGET / "index.html")
    ensure_dir(TARGET / "api")
    shutil.copy2(ROOT / "api" / "subscribe.php", TARGET / "api" / "subscribe.php")
    ensure_dir(TARGET / "data")
    shutil.copy2(ROOT / "data" / ".htaccess", TARGET / "data" / ".htaccess")
    # Optional README to ship deployment notes alongside the payload
    if (ROOT / "README-CPANEL.md").exists():
        shutil.copy2(ROOT / "README-CPANEL.md", TARGET / "README-CPANEL.md")


def write_htaccess() -> None:
    (TARGET / ".htaccess").write_text(HTACCESS_CONTENT)


def clean_target() -> None:
    if TARGET.exists():
        shutil.rmtree(TARGET)


def main() -> None:
    clean_target()
    copy_text_files()
    write_htaccess()
    print("cPanel payload ready in cpanel_public_html/ (text-only).")


if __name__ == "__main__":
    main()
