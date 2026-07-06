"""
Production settings.

Inherits from base and applies strict security overrides.
All values must come from environment variables — no hardcoded secrets.

Future improvements:
- AWS RDS for managed PostgreSQL
- ElastiCache for managed Redis
- S3 + WhiteNoise or CloudFront for static files
- CloudWatch for centralised logging
- JWT authentication (djangorestframework-simplejwt)
"""
from decouple import Csv, config

from .base import *  # noqa: F401, F403

# ── Core ──────────────────────────────────────────────────────────────────────
DEBUG = False

ALLOWED_HOSTS: list[str] = config("ALLOWED_HOSTS", cast=Csv())

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS: list[str] = config("CORS_ALLOWED_ORIGINS", cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# ── Security Hardening ────────────────────────────────────────────────────────
SECURE_HSTS_SECONDS = 31_536_000          # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
