from __future__ import annotations

from datetime import timedelta

from django.conf import settings as django_settings
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import get_admin_platform_security_settings


class JWTActivityAuthentication(JWTAuthentication):
    def authenticate(self, request):
        res = super().authenticate(request)
        if res is None:
            return None
        user, token = res

        path = str(getattr(request, "path", "") or "")
        is_admin_path = path.startswith("/api/v1/")
        is_admin_user = (getattr(user, "role", "") or "").lower() == "admin" or bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))

        now = timezone.now()
        last = getattr(user, "last_login", None)

        if is_admin_path and is_admin_user:
            sec = get_admin_platform_security_settings()

            if bool(sec.get("ip_whitelisting")):
                allow = []
                raw_allow = sec.get("ip_whitelist") or []
                if isinstance(raw_allow, str):
                    allow.extend([p.strip() for p in raw_allow.replace("\n", ",").split(",") if p.strip()])
                elif isinstance(raw_allow, list):
                    allow.extend([str(x).strip() for x in raw_allow if str(x).strip()])

                env_allow = str(getattr(django_settings, "ADMIN_IP_WHITELIST", "") or "").strip()
                if env_allow:
                    allow.extend([p.strip() for p in env_allow.replace("\n", ",").split(",") if p.strip()])

                client_ip = ""
                try:
                    xff = str(request.META.get("HTTP_X_FORWARDED_FOR") or "").strip()
                    if xff:
                        client_ip = xff.split(",")[0].strip()
                    else:
                        client_ip = str(request.META.get("REMOTE_ADDR") or "").strip()
                except Exception:
                    client_ip = ""

                ok = False
                if client_ip and allow:
                    try:
                        import ipaddress

                        ip = ipaddress.ip_address(client_ip)
                        for entry in allow:
                            try:
                                if "/" in entry:
                                    if ip in ipaddress.ip_network(entry, strict=False):
                                        ok = True
                                        break
                                else:
                                    if ip == ipaddress.ip_address(entry):
                                        ok = True
                                        break
                            except Exception:
                                continue
                    except Exception:
                        ok = False

                if not ok:
                    raise AuthenticationFailed("Access restricted by IP whitelist.")

            timeout_min = 0
            try:
                timeout_min = int(sec.get("session_timeout_minutes") or 0)
            except Exception:
                timeout_min = 0
            if timeout_min > 0 and last is not None and last < (now - timedelta(minutes=timeout_min)):
                raise AuthenticationFailed("Session expired. Please sign in again.")

            if bool(sec.get("two_factor_auth")) and not bool(getattr(user, "two_factor_enabled", False)):
                allow_enrollment = path.startswith("/api/v1/security/totp/") or path.startswith("/api/v1/security/recovery-codes")
                if not allow_enrollment:
                    raise AuthenticationFailed("Two-factor authentication required for admin access.")

        try:
            if last is None or last < (now - timedelta(seconds=60)):
                user.__class__.objects.filter(pk=user.pk).update(last_login=now)
                user.last_login = now
        except Exception:
            pass

        return user, token
