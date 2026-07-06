"""
Development settings.

Inherits from base and applies developer-friendly overrides:
- DEBUG mode on
- All origins allowed for CORS (frontend dev server)
- Browsable API renderer enabled for DRF
"""
from .base import *  # noqa: F401, F403

# ── Core ──────────────────────────────────────────────────────────────────────
DEBUG = True
ALLOWED_HOSTS = ["*"]

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow all origins in development so the Vite dev server can talk to Django.
# In production this must be a strict allowlist.
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ── DRF ───────────────────────────────────────────────────────────────────────
# Add the browsable API in development for interactive exploration.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # type: ignore[name-defined]  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

# ── Email (console backend — no SMTP required locally) ────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
