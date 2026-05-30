from datetime import datetime, timedelta, time as dt_time

from django.core.cache import cache
from django.db.models import Avg, Case, Count, IntegerField, Q, Sum, When
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsBuyer, IsSeller
from apps.accounts.permissions import IsAdmin
from apps.accounts.admin_utils import AdminPageNumberPagination, audit
from apps.accounts.models import AuditLog, User
from apps.catalog.models import Product

from .models import QualityInspection, Sample, SampleRequest
from .serializers import (
    AdminQualityInspectionDetailSerializer,
    AdminQualityInspectionListSerializer,
    AdminQualityInspectionWriteSerializer,
    SampleRequestSerializer,
    SampleSerializer,
)


class SampleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SampleSerializer

    def get_queryset(self):
        return Sample.objects.filter(seller=self.request.user, deleted_at__isnull=True).select_related("product")

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class SampleRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SampleRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = SampleRequest.objects.filter(deleted_at__isnull=True).select_related("product", "product__seller")
        if getattr(user, "account_type", None) == "seller":
            return qs.filter(product__seller=user)
        return qs.filter(buyer=user)

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsBuyer()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)


class AdminQualityViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminQualityInspectionListSerializer
    pagination_class = AdminPageNumberPagination

    def get_queryset(self):
        return (
            QualityInspection.objects.filter(deleted_at__isnull=True)
            .select_related("product", "seller", "seller__seller_profile", "inspector", "inspector__admin_profile")
            .order_by("-created_at")
        )

    def _parse_dt(self, raw):
        if not raw:
            return None
        s = str(raw).strip()
        if not s:
            return None
        dt = parse_datetime(s)
        if dt is None:
            d = parse_date(s)
            if d is None:
                return None
            dt = datetime.combine(d, dt_time.min)
        if timezone.is_naive(dt):
            try:
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            except Exception:
                pass
        return dt

    def _parse_dt_end(self, raw):
        if not raw:
            return None
        s = str(raw).strip()
        if not s:
            return None
        dt = parse_datetime(s)
        if dt is None:
            d = parse_date(s)
            if d is None:
                return None
            dt = datetime.combine(d, dt_time.max)
        if timezone.is_naive(dt):
            try:
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            except Exception:
                pass
        return dt

    def list(self, request):
        qs = self.get_queryset()
        q = (request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(product__name__icontains=q)
                | Q(product__sku__icontains=q)
                | Q(seller__email__icontains=q)
                | Q(seller__phone__icontains=q)
                | Q(inspector_name__icontains=q)
                | Q(inspector__email__icontains=q)
                | Q(inspector__phone__icontains=q)
            )

        seller_id_raw = (request.query_params.get("seller_id") or "").strip()
        if seller_id_raw.isdigit():
            qs = qs.filter(seller_id=int(seller_id_raw))

        inspector_id_raw = (request.query_params.get("inspector_id") or "").strip()
        if inspector_id_raw.isdigit():
            qs = qs.filter(inspector_id=int(inspector_id_raw))

        product_id_raw = (request.query_params.get("product_id") or "").strip()
        if product_id_raw.isdigit():
            qs = qs.filter(product_id=int(product_id_raw))

        sku = (request.query_params.get("sku") or request.query_params.get("product_sku") or "").strip()
        if sku:
            qs = qs.filter(product__sku__icontains=sku)

        score_min_raw = (request.query_params.get("score_min") or "").strip()
        try:
            if score_min_raw != "":
                score_min = int(score_min_raw)
                qs = qs.filter(score__gte=max(0, score_min))
        except Exception:
            pass

        score_max_raw = (request.query_params.get("score_max") or "").strip()
        try:
            if score_max_raw != "":
                score_max = int(score_max_raw)
                qs = qs.filter(score__lte=min(100, score_max))
        except Exception:
            pass

        unassigned_inspector = (request.query_params.get("unassigned_inspector") or "").strip().lower()
        if unassigned_inspector in {"1", "true", "yes", "y"}:
            qs = qs.filter(inspector__isnull=True).filter(inspector_name="")

        failed_only = (request.query_params.get("failed_only") or "").strip().lower()
        pending_only = (request.query_params.get("pending_only") or "").strip().lower()
        if failed_only in {"1", "true", "yes", "y"}:
            qs = qs.filter(status=QualityInspection.Status.FAILED)
        elif pending_only in {"1", "true", "yes", "y"}:
            qs = qs.filter(status=QualityInspection.Status.IN_PROGRESS)
        else:
            status_filter = (request.query_params.get("status") or "").strip().lower()
            if status_filter and status_filter != "all":
                statuses = [s.strip() for s in status_filter.split(",") if s.strip()]
                if len(statuses) > 1:
                    qs = qs.filter(status__in=statuses)
                else:
                    qs = qs.filter(status=statuses[0] if statuses else status_filter)

        inspected_from = self._parse_dt(request.query_params.get("inspected_from"))
        if inspected_from is not None:
            qs = qs.filter(inspected_at__isnull=False, inspected_at__gte=inspected_from)

        inspected_to = self._parse_dt_end(request.query_params.get("inspected_to"))
        if inspected_to is not None:
            qs = qs.filter(inspected_at__isnull=False, inspected_at__lte=inspected_to)

        days_raw = (request.query_params.get("days") or "").strip()
        if days_raw:
            try:
                days = max(1, min(365, int(days_raw)))
                qs = qs.filter(created_at__gte=(timezone.now() - timedelta(days=days)))
            except Exception:
                pass

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AdminQualityInspectionListSerializer(page, many=True).data)
        data = AdminQualityInspectionListSerializer(qs[:50], many=True).data
        return Response({"count": len(data), "next": None, "previous": None, "results": data})

    def retrieve(self, request, pk=None):
        obj = self.get_queryset().filter(id=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        data = AdminQualityInspectionDetailSerializer(obj).data

        def _user_label(u: User | None) -> str:
            if not u:
                return "—"
            buyer_prof = getattr(u, "buyer_profile", None)
            nm = (getattr(buyer_prof, "name", "") or "").strip() if buyer_prof else ""
            if nm:
                return nm
            full = f"{(getattr(u, 'first_name', '') or '').strip()} {(getattr(u, 'last_name', '') or '').strip()}".strip()
            return full or (getattr(u, "email", "") or getattr(u, "phone", "") or f"user:{getattr(u, 'id', '')}")

        sample_qs = (
            SampleRequest.objects.filter(deleted_at__isnull=True, product_id=obj.product_id)
            .select_related("buyer", "buyer__buyer_profile")
            .order_by("-requested_at")
        )
        recent = []
        for sr in list(sample_qs[:5]):
            buyer = getattr(sr, "buyer", None)
            recent.append(
                {
                    "sample_request_id": sr.id,
                    "buyer_id": getattr(buyer, "id", None) if buyer else None,
                    "buyer_label": _user_label(buyer),
                    "buyer_contact": {
                        "email": (getattr(buyer, "email", "") or "").strip() if buyer else "",
                        "phone": (getattr(buyer, "phone", "") or "").strip() if buyer else "",
                    },
                    "status": sr.status,
                    "requested_at": sr.requested_at,
                }
            )

        data["recent_sample_requests_count"] = sample_qs.count()
        data["recent_sample_requests"] = recent
        return Response(data)

    @action(detail=True, methods=["get"], url_path="audit")
    def audit_trail(self, request, pk=None):
        ins = self.get_queryset().filter(id=pk).first()
        if not ins:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = max(1, min(50, int(limit_raw or "15")))
        except Exception:
            limit = 15

        qs = (
            AuditLog.objects.filter(target_type="quality_inspection", target_id=str(ins.id))
            .select_related("actor", "actor__admin_profile")
            .order_by("-occurred_at")[:limit]
        )

        def _actor_label(u: User | None) -> str:
            if not u:
                return "System"
            full = f"{(getattr(u, 'first_name', '') or '').strip()} {(getattr(u, 'last_name', '') or '').strip()}".strip()
            return full or (getattr(u, "email", "") or getattr(u, "phone", "") or f"user:{getattr(u, 'id', '')}")

        rows = []
        for ev in list(qs):
            actor = getattr(ev, "actor", None)
            rows.append(
                {
                    "id": ev.id,
                    "occurred_at": ev.occurred_at,
                    "action": ev.action,
                    "payload": ev.payload or {},
                    "actor": {
                        "id": getattr(actor, "id", None) if actor else None,
                        "label": _actor_label(actor),
                        "email": (getattr(actor, "email", "") or "").strip() if actor else "",
                        "phone": (getattr(actor, "phone", "") or "").strip() if actor else "",
                        "admin_role": getattr(getattr(actor, "admin_profile", None), "admin_role", None) if actor else None,
                    },
                }
            )
        return Response({"results": rows})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        now = timezone.now()
        days_raw = (request.query_params.get("days") or "").strip()
        try:
            days = max(7, min(365, int(days_raw or "30")))
        except Exception:
            days = 30

        cache_key = f"admin_quality_stats:{days}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        window = now - timedelta(days=days)
        prev_window = window - timedelta(days=days)

        base = self.get_queryset()
        recent = base.filter(created_at__gte=window)
        prev = base.filter(created_at__gte=prev_window, created_at__lt=window)

        avg_score = recent.aggregate(v=Avg("score"))["v"] or 0
        prev_avg = prev.aggregate(v=Avg("score"))["v"] or 0
        delta = float(avg_score) - float(prev_avg)

        completed = recent.exclude(status=QualityInspection.Status.IN_PROGRESS)
        passed = completed.filter(status=QualityInspection.Status.PASSED).count()
        failed = completed.filter(status=QualityInspection.Status.FAILED).count()
        pass_rate = (passed * 100.0 / (passed + failed)) if (passed + failed) else 0.0

        pending = recent.filter(status=QualityInspection.Status.IN_PROGRESS).count()

        start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        failed_month = base.filter(created_at__gte=start_month, status=QualityInspection.Status.FAILED).count()

        payload = {
            "days": days,
            "avg_quality_score": round(float(avg_score), 0),
            "avg_quality_score_delta": round(delta, 0),
            "pass_rate": round(pass_rate, 1),
            "pending": pending,
            "failed": failed_month,
        }
        cache.set(cache_key, payload, timeout=60)
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="trend")
    def trend(self, request):
        metric = (request.query_params.get("metric") or "").strip().lower()
        if metric not in {"", "avg_score", "score", "count", "pass_rate", "rate"}:
            metric = "avg_score"
        metric = "avg_score" if metric in {"", "score"} else metric
        metric = "pass_rate" if metric in {"rate"} else metric

        days_raw = (request.query_params.get("days") or "").strip()
        if days_raw:
            try:
                days = max(2, min(31, int(days_raw)))
            except Exception:
                days = 14
            cache_key = f"admin_quality_trend:days:{days}:metric:{metric}"
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)
            start = timezone.now() - timedelta(days=days - 1)
            qs = self.get_queryset().filter(created_at__gte=start).annotate(d=TruncDate("created_at")).values("d")
            rows = qs.annotate(
                count=Count("id"),
                passed=Sum(
                    Case(
                        When(status=QualityInspection.Status.PASSED, then=1),
                        default=0,
                        output_field=IntegerField(),
                    )
                ),
                failed=Sum(
                    Case(
                        When(status=QualityInspection.Status.FAILED, then=1),
                        default=0,
                        output_field=IntegerField(),
                    )
                ),
                score=Avg(
                    Case(
                        When(status__in=[QualityInspection.Status.PASSED, QualityInspection.Status.FAILED], then="score"),
                        default=None,
                    )
                ),
            ).order_by("d")

            by_day: dict = {}
            for r in rows:
                d = r.get("d")
                if not d:
                    continue
                passed = int(r.get("passed") or 0)
                failed = int(r.get("failed") or 0)
                completed = passed + failed
                by_day[d] = {
                    "count": int(r.get("count") or 0),
                    "completed": completed,
                    "score": round(float(r.get("score") or 0), 0) if completed else 0,
                    "pass_rate": round((passed * 100.0 / completed) if completed else 0.0, 1),
                }

            data = []
            start_d = start.date()
            for i in range(days):
                cur = start_d + timedelta(days=i)
                label = cur.strftime("%a") if days <= 7 else cur.strftime("%b %d")
                row = by_day.get(cur) or {"count": 0, "completed": 0, "score": 0, "pass_rate": 0.0}
                data.append({"month": label, **row})
            cache.set(cache_key, data, timeout=60)
            return Response(data)

        months_raw = (request.query_params.get("months") or "").strip()
        try:
            months = max(2, min(24, int(months_raw or "6")))
        except Exception:
            months = 6

        cache_key = f"admin_quality_trend:months:{months}:metric:{metric}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        now = timezone.now()
        start = now - timedelta(days=31 * (months - 1))

        qs = self.get_queryset().filter(created_at__gte=start).annotate(m=TruncMonth("created_at")).values("m")
        rows = qs.annotate(
            count=Count("id"),
            passed=Sum(
                Case(
                    When(status=QualityInspection.Status.PASSED, then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            failed=Sum(
                Case(
                    When(status=QualityInspection.Status.FAILED, then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            score=Avg(
                Case(
                    When(status__in=[QualityInspection.Status.PASSED, QualityInspection.Status.FAILED], then="score"),
                    default=None,
                )
            ),
        ).order_by("m")

        by_month: dict = {}
        for r in rows:
            m = r.get("m")
            if not m:
                continue
            passed = int(r.get("passed") or 0)
            failed = int(r.get("failed") or 0)
            completed = passed + failed
            by_month[m.date()] = {
                "count": int(r.get("count") or 0),
                "completed": completed,
                "score": round(float(r.get("score") or 0), 0) if completed else 0,
                "pass_rate": round((passed * 100.0 / completed) if completed else 0.0, 1),
            }

        def _month_add(d):
            y = d.year
            m = d.month + 1
            if m > 12:
                y += 1
                m = 1
            return datetime(y, m, 1, tzinfo=timezone.get_current_timezone()).date()

        first = datetime(start.year, start.month, 1, tzinfo=start.tzinfo).date()
        cur = first
        data = []
        for _ in range(months):
            row = by_month.get(cur) or {"count": 0, "completed": 0, "score": 0, "pass_rate": 0.0}
            data.append({"month": cur.strftime("%b"), **row})
            cur = _month_add(cur)
        cache.set(cache_key, data, timeout=60)
        return Response(data)

    @action(detail=False, methods=["get"], url_path="distribution")
    def distribution(self, request):
        days_raw = (request.query_params.get("days") or "").strip()
        try:
            days = max(1, min(365, int(days_raw or "30")))
        except Exception:
            days = 30

        cache_key = f"admin_quality_distribution:{days}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        window = timezone.now() - timedelta(days=days)

        qs = self.get_queryset().filter(created_at__gte=window).exclude(status=QualityInspection.Status.IN_PROGRESS)
        total_count = qs.count() or 0
        denom = total_count or 1

        excellent = qs.filter(score__gte=90).count()
        good = qs.filter(score__gte=80, score__lte=89).count()
        fair = qs.filter(score__gte=70, score__lte=79).count()
        poor = qs.filter(score__lt=70).count()

        payload = {
            "days": days,
            "total_count": total_count,
            "excellent": round(excellent * 100.0 / denom, 0),
            "good": round(good * 100.0 / denom, 0),
            "fair": round(fair * 100.0 / denom, 0),
            "poor": round(poor * 100.0 / denom, 0),
            "excellent_count": excellent,
            "good_count": good,
            "fair_count": fair,
            "poor_count": poor,
        }
        cache.set(cache_key, payload, timeout=60)
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="recent")
    def recent(self, request):
        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = max(1, min(50, int(limit_raw or "10")))
        except Exception:
            limit = 10

        qs = self.get_queryset()[:limit]
        return Response(AdminQualityInspectionListSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="set")
    def set_inspection(self, request, pk=None):
        ins = self.get_queryset().filter(id=pk).first()
        if not ins:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        changed: list[str] = []
        status_val = (request.data.get("status") or "").strip().lower()
        if status_val in {QualityInspection.Status.IN_PROGRESS, QualityInspection.Status.PASSED, QualityInspection.Status.FAILED}:
            ins.status = status_val
            changed.append("status")

        if "score" in request.data:
            try:
                score = int(request.data.get("score"))
                if 0 <= score <= 100:
                    ins.score = score
                    changed.append("score")
            except Exception:
                return Response({"score": "score must be an integer 0-100."}, status=status.HTTP_400_BAD_REQUEST)

        if "inspector_id" in request.data:
            raw = request.data.get("inspector_id")
            if raw in {None, "", 0, "0"}:
                ins.inspector = None
                changed.append("inspector")
            else:
                try:
                    iid = int(raw)
                except Exception:
                    return Response({"inspector_id": "inspector_id must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
                user = User.objects.filter(id=iid).first()
                if not user:
                    return Response({"inspector_id": "Inspector not found."}, status=status.HTTP_400_BAD_REQUEST)
                ins.inspector = user
                changed.append("inspector")
                if (ins.inspector_name or "") != "":
                    ins.inspector_name = ""
                    changed.append("inspector_name")

        if "inspector_name" in request.data:
            nm = (request.data.get("inspector_name") or "").strip()
            ins.inspector_name = nm
            changed.append("inspector_name")
            if nm and ins.inspector_id is not None:
                ins.inspector = None
                changed.append("inspector")

        if "inspected_at" in request.data:
            ins.inspected_at = request.data.get("inspected_at") or None
            changed.append("inspected_at")

        if changed:
            ins.save(update_fields=list(set(changed)))
            audit(request.user, action="admin_quality_inspection_updated", target_type="quality_inspection", target_id=str(ins.id), payload={"fields": changed})

        return Response(AdminQualityInspectionDetailSerializer(ins).data)

    def create(self, request):
        ser = AdminQualityInspectionWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        product = Product.objects.filter(id=data["product_id"]).first()
        seller = User.objects.filter(id=data["seller_id"]).first()
        inspector = User.objects.filter(id=data.get("inspector_id")).first() if data.get("inspector_id") else None
        if not product or not seller:
            return Response({"detail": "Invalid product or seller."}, status=status.HTTP_400_BAD_REQUEST)

        ins = QualityInspection.objects.create(
            product=product,
            seller=seller,
            inspector=inspector,
            inspector_name=(data.get("inspector_name") or "").strip(),
            status=data.get("status") or QualityInspection.Status.IN_PROGRESS,
            score=int(data.get("score") or 0),
            inspected_at=data.get("inspected_at") if "inspected_at" in data else None,
        )
        audit(
            request.user,
            action="admin_quality_inspection_created",
            target_type="quality_inspection",
            target_id=str(ins.id),
            payload={"product_id": str(product.id), "seller_id": str(seller.id)},
        )
        return Response(AdminQualityInspectionListSerializer(ins).data, status=status.HTTP_201_CREATED)
