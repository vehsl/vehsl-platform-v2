import os

from .base import *  # noqa: F401,F403


# Point local/CI test runs at a reachable PostgreSQL host rather than the
# Docker-internal hostname used by the production container.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "vehsl"),
        "USER": os.environ.get("POSTGRES_USER", "vehsl"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "vehsl"),
        "HOST": os.environ.get("POSTGRES_HOST", "127.0.0.1"),
        "PORT": int(os.environ.get("POSTGRES_PORT", "5432")),
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
