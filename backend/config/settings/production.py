import os

from .base import *

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", SECRET_KEY)
DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"

ALLOWED_HOSTS = [h for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",") if h]

DATABASES["default"]["NAME"] = os.environ.get("POSTGRES_DB", DATABASES["default"]["NAME"])
DATABASES["default"]["USER"] = os.environ.get("POSTGRES_USER", DATABASES["default"]["USER"])
DATABASES["default"]["PASSWORD"] = os.environ.get("POSTGRES_PASSWORD", DATABASES["default"]["PASSWORD"])
DATABASES["default"]["HOST"] = os.environ.get("POSTGRES_HOST", DATABASES["default"]["HOST"])
DATABASES["default"]["PORT"] = int(os.environ.get("POSTGRES_PORT", str(DATABASES["default"]["PORT"])))

CORS_ALLOWED_ORIGINS = [
    o for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o
]
