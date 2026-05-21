from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsBuyer, IsSeller
from apps.accounts.permissions import IsAdmin
from apps.accounts.admin_utils import audit
from apps.accounts.models import User
from apps.catalog.models import Product

from .models import QualityInspection, Sample, SampleRequest
from .serializers import (
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

    def get_queryset(self):
        return (
            QualityInspection.objects.filter(deleted_at__isnull=True)
            .select_related("product", "seller", "inspector")
            .order_by("-created_at")
        )

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        now = timezone.now()
        window = now - timedelta(days=30)
        prev_window = window - timedelta(days=30)

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
                "avg_quality_score": round(float(avg_score), 0),
                "avg_quality_score_delta": round(delta, 0),
                "pass_rate": round(pass_rate, 1),
                "pending": pending,
                "failed": failed_month,
            }
        )

    @action(detail=False, methods=["get"], url_path="trend")
    def trend(self, request):
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
