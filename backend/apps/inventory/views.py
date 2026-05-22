from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsBuyer, IsSeller
from apps.accounts.permissions import IsAdmin
from apps.accounts.admin_utils import AdminPageNumberPagination, audit
from apps.accounts.models import User
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
            .select_related("product", "seller", "inspector")
            .order_by("-created_at")
        )

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

        status_filter = (request.query_params.get("status") or "").strip().lower()
        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)

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
        return Response(AdminQualityInspectionDetailSerializer(obj).data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        now = timezone.now()
        days_raw = (request.query_params.get("days") or "").strip()
        try:
            days = max(7, min(365, int(days_raw or "30")))
        except Exception:
            days = 30

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

        return Response(
            {
                "days": days,
                "avg_quality_score": round(float(avg_score), 0),
                "avg_quality_score_delta": round(delta, 0),
                "pass_rate": round(pass_rate, 1),
                "pending": pending,
                "failed": failed_month,
            }
        )

    @action(detail=False, methods=["get"], url_path="trend")
    def trend(self, request):
        days_raw = (request.query_params.get("days") or "").strip()
        if days_raw:
            try:
                days = max(2, min(31, int(days_raw)))
            except Exception:
                days = 14
            start = timezone.now() - timedelta(days=days - 1)
            rows = (
                self.get_queryset()
                .filter(created_at__gte=start)
                .exclude(status=QualityInspection.Status.IN_PROGRESS)
                .annotate(d=TruncDate("created_at"))
                .values("d")
                .annotate(score=Avg("score"))
                .order_by("d")
            )
            data = []
            for r in rows:
                d = r.get("d")
                if not d:
                    continue
                label = d.strftime("%a") if days <= 7 else d.strftime("%b %d")
                data.append({"month": label, "score": round(float(r["score"] or 0), 0)})
            return Response(data)

        months_raw = (request.query_params.get("months") or "").strip()
        try:
            months = max(2, min(24, int(months_raw or "6")))
        except Exception:
            months = 6

        now = timezone.now()
        start = now - timedelta(days=31 * (months - 1))

        rows = (
            self.get_queryset()
            .filter(created_at__gte=start)
            .annotate(m=TruncMonth("created_at"))
            .values("m")
            .annotate(score=Avg("score"))
            .order_by("m")
        )
        data = []
        for r in rows:
            m = r["m"]
            if not m:
                continue
            data.append({"month": m.strftime("%b"), "score": round(float(r["score"] or 0), 0)})
        return Response(data)

    @action(detail=False, methods=["get"], url_path="distribution")
    def distribution(self, request):
        days_raw = (request.query_params.get("days") or "").strip()
        try:
            days = max(1, min(365, int(days_raw or "30")))
        except Exception:
            days = 30
        window = timezone.now() - timedelta(days=days)

        qs = self.get_queryset().filter(created_at__gte=window).exclude(status=QualityInspection.Status.IN_PROGRESS)
        total = qs.count() or 1

        excellent = qs.filter(score__gte=90).count()
        good = qs.filter(score__gte=80, score__lte=89).count()
        fair = qs.filter(score__gte=70, score__lte=79).count()
        poor = qs.filter(score__lt=70).count()

        return Response(
            {
                "days": days,
                "excellent": round(excellent * 100.0 / total, 0),
                "good": round(good * 100.0 / total, 0),
                "fair": round(fair * 100.0 / total, 0),
                "poor": round(poor * 100.0 / total, 0),
            }
        )

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
