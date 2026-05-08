from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from apps.accounts.permissions import IsBuyer
from apps.orders.models import Order

from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related("order").filter(deleted_at__isnull=True)
        if getattr(user, "account_type", None) == "seller":
            return qs.filter(order__seller=user)
        return qs.filter(order__buyer=user)

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsBuyer()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        order: Order = ser.validated_data["order"]
        if order.buyer_id != request.user.id:
            return Response({"detail": "Not your order."}, status=status.HTTP_403_FORBIDDEN)
        if order.currency != ser.validated_data.get("currency", order.currency):
            return Response({"detail": "Currency mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        payment = ser.save(status=Payment.Status.INITIATED)
        return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)
