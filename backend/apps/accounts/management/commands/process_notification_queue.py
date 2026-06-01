import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings as django_settings
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone

from apps.accounts.models import AdminPlatformSettings, Notification, admin_platform_settings_defaults


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=200)
        parser.add_argument("--dry-run", action="store_true", default=False)

    def handle(self, *args, **options):
        limit = int(options.get("limit") or 200)
        dry_run = bool(options.get("dry_run"))

        defaults = admin_platform_settings_defaults()
        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        general = {**defaults["general"], **(obj.general or {})}
        notif_settings = {**defaults["notifications"], **(obj.notifications or {})}

        enabled_map = general.get("integrations_enabled") if isinstance(general.get("integrations_enabled"), dict) else dict(defaults["general"]["integrations_enabled"])
        creds = general.get("integration_credentials") if isinstance(general.get("integration_credentials"), dict) else dict(defaults["general"]["integration_credentials"])

        sendgrid_key = str(creds.get("sendgrid_api_key") or "").strip() or str(getattr(django_settings, "SENDGRID_API_KEY", "") or "").strip()
        twilio_sid = str(creds.get("twilio_account_sid") or "").strip() or str(getattr(django_settings, "TWILIO_ACCOUNT_SID", "") or "").strip()
        twilio_token = str(creds.get("twilio_auth_token") or "").strip() or str(getattr(django_settings, "TWILIO_AUTH_TOKEN", "") or "").strip()
        twilio_from = str(getattr(django_settings, "TWILIO_FROM_NUMBER", "") or os.environ.get("TWILIO_FROM_NUMBER") or "").strip()

        sendgrid_from = str(getattr(django_settings, "SENDGRID_FROM_EMAIL", "") or os.environ.get("SENDGRID_FROM_EMAIL") or "").strip()

        qs = Notification.objects.filter(status=Notification.Status.QUEUED).order_by("created_at")[:limit]

        processed = 0
        sent = 0
        failed = 0
        skipped = 0

        for n in qs:
            processed += 1
            channel = (n.channel or "").strip().lower()
            user = n.user
            now = timezone.now()

            if channel == Notification.Channel.IN_APP:
                if not dry_run:
                    Notification.objects.filter(id=n.id).update(status=Notification.Status.SENT, sent_at=now)
                sent += 1
                continue

            if channel == Notification.Channel.PUSH:
                if not dry_run:
                    Notification.objects.filter(id=n.id).update(status=Notification.Status.SENT, sent_at=now)
                sent += 1
                continue

            if channel == Notification.Channel.EMAIL:
                if not bool(notif_settings.get("email_notifications")):
                    skipped += 1
                    continue
                to_email = (getattr(user, "email", "") or "").strip()
                if not to_email:
                    if not dry_run:
                        Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
                    failed += 1
                    continue

                subject = str((n.payload or {}).get("subject") or "Vehsl notification").strip()
                body = str((n.payload or {}).get("body") or (n.payload or {}).get("message") or "Notification").strip()

                if bool(enabled_map.get("sendgrid_email", True)) and sendgrid_key and sendgrid_from:
                    if dry_run:
                        sent += 1
                        continue
                    try:
                        payload = {
                            "personalizations": [{"to": [{"email": to_email}]}],
                            "from": {"email": sendgrid_from},
                            "subject": subject,
                            "content": [{"type": "text/plain", "value": body}],
                        }
                        req = urllib.request.Request(
                            "https://api.sendgrid.com/v3/mail/send",
                            data=json.dumps(payload).encode("utf-8"),
                            headers={"Authorization": f"Bearer {sendgrid_key}", "Content-Type": "application/json"},
                            method="POST",
                        )
                        with urllib.request.urlopen(req, timeout=10) as resp:
                            if int(resp.getcode() or 0) in {200, 202}:
                                Notification.objects.filter(id=n.id).update(status=Notification.Status.SENT, sent_at=now)
                                sent += 1
                                continue
                    except Exception:
                        pass

                if dry_run:
                    sent += 1
                    continue
                try:
                    send_mail(
                        subject=subject,
                        message=body,
                        from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", None) or "no-reply@vehsl.local",
                        recipient_list=[to_email],
                        fail_silently=False,
                    )
                    Notification.objects.filter(id=n.id).update(status=Notification.Status.SENT, sent_at=now)
                    sent += 1
                except Exception:
                    Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
                    failed += 1
                continue

            if channel == Notification.Channel.SMS:
                if not bool(notif_settings.get("sms_alerts")):
                    skipped += 1
                    continue
                if not bool(enabled_map.get("twilio_sms", True)):
                    skipped += 1
                    continue
                to_phone = (getattr(user, "phone", "") or "").strip()
                if not to_phone or not (twilio_sid and twilio_token and twilio_from):
                    if not dry_run:
                        Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
                    failed += 1
                    continue

                body = str((n.payload or {}).get("body") or (n.payload or {}).get("message") or "Vehsl notification").strip()
                if dry_run:
                    sent += 1
                    continue
                try:
                    payload = urllib.parse.urlencode({"To": to_phone, "From": twilio_from, "Body": body}).encode("utf-8")
                    auth = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode("utf-8")).decode("utf-8")
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{urllib.parse.quote(twilio_sid)}/Messages.json"
                    req = urllib.request.Request(
                        url,
                        data=payload,
                        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"},
                        method="POST",
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        if int(resp.getcode() or 0) in {200, 201}:
                            Notification.objects.filter(id=n.id).update(status=Notification.Status.SENT, sent_at=now)
                            sent += 1
                        else:
                            Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
                            failed += 1
                except urllib.error.HTTPError:
                    Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
                    failed += 1
                except Exception:
                    Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
                    failed += 1
                continue

            if not dry_run:
                Notification.objects.filter(id=n.id).update(status=Notification.Status.FAILED)
            failed += 1

        self.stdout.write(self.style.SUCCESS(f"processed={processed} sent={sent} failed={failed} skipped={skipped} dry_run={dry_run}"))

