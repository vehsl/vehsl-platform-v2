from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsBuyer, IsSeller

from .models import Sample, SampleRequest
from .serializers import SampleRequestSerializer, SampleSerializer


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
