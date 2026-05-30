from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTActivityAuthentication(JWTAuthentication):
    def authenticate(self, request):
        res = super().authenticate(request)
        if res is None:
            return None
        user, token = res

        now = timezone.now()
        last = getattr(user, "last_login", None)
        try:
            if last is None or last < (now - timedelta(seconds=60)):
                user.__class__.objects.filter(pk=user.pk).update(last_login=now)
                user.last_login = now
        except Exception:
            pass

        return user, token

