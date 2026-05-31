from __future__ import annotations

from datetime import timedelta

from django.http import HttpResponseForbidden
from django.utils import timezone

from .models import get_admin_platform_security_settings


class AdminWebSecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            path = str(getattr(request, "path", "") or "")
        except Exception:
            path = ""

        if path.startswith("/admin/"):
            user = getattr(request, "user", None)
            is_authed = bool(getattr(user, "is_authenticated", False))
            is_admin_user = (
                (getattr(user, "role", "") or "").lower() == "admin"
                or bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))
            )
            if is_authed and is_admin_user:
                sec = get_admin_platform_security_settings()

                if bool(sec.get("ip_whitelisting")):
                    allow = []
                    raw_allow = sec.get("ip_whitelist") or []
                    if isinstance(raw_allow, str):
                        allow.extend([p.strip() for p in raw_allow.replace("\n", ",").split(",") if p.strip()])
                    elif isinstance(raw_allow, list):
                        allow.extend([str(x).strip() for x in raw_allow if str(x).strip()])

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
                        return HttpResponseForbidden("Access restricted by IP whitelist.")

                timeout_min = 0
                try:
                    timeout_min = int(sec.get("session_timeout_minutes") or 0)
                except Exception:
                    timeout_min = 0
                last = getattr(user, "last_login", None)
                if timeout_min > 0 and last is not None and last < (timezone.now() - timedelta(minutes=timeout_min)):
                    return HttpResponseForbidden("Session expired. Please sign in again.")

                if bool(sec.get("two_factor_auth")) and not bool(getattr(user, "two_factor_enabled", False)):
                    return HttpResponseForbidden("Two-factor authentication required for admin access.")

        return self.get_response(request)

