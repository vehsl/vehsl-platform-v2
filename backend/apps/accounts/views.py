from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller

from .models import AdminProfile, ChatMessage, ChatThread, Notification, Subscription, User, UserProfile
from .serializers import (
    AdminProfileUpdateSerializer,
    BuyerProfileSerializer,
    ChatMessageSerializer,
    ChatThreadSerializer,
    NotificationSerializer,
    MeUpdateSerializer,
    RegisterSerializer,
    SellerProfileSerializer,
    SubscriptionSerializer,
    UserSerializer,
    VehslTokenObtainPairSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)


class LoginView(TokenObtainPairView):
    serializer_class = VehslTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    pass


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh") or request.data.get("refresh_token") or ""
        refresh = str(refresh or "").strip()
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except TokenError:
                pass
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        ser = MeUpdateSerializer(data=request.data, partial=True, context={"user": request.user})
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        user = request.user
        for f in ["first_name", "last_name"]:
            if f in data:
                setattr(user, f, data.get(f) or "")

        if "phone" in data:
            phone_val = data.get("phone")
            user.phone = phone_val or None

        user.full_clean(exclude=["email"])
        user.save()

        profile = getattr(user, "profile", None)
        if profile is None:
            profile = UserProfile.objects.create(user=user)
        for f in ["country", "province", "city", "street", "address", "nationality", "gender", "date_of_birth"]:
            if f in data:
                setattr(profile, f, data.get(f) or (None if f == "date_of_birth" else ""))
        profile.save()

        return Response(UserSerializer(user).data)


class BuyerProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsBuyer]
    serializer_class = BuyerProfileSerializer

    def get_object(self):
        return self.request.user.buyer_profile


class SellerProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerProfileSerializer

    def get_object(self):
        return self.request.user.seller_profile


class AdminProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminProfileUpdateSerializer

    def get_object(self):
        prof = getattr(self.request.user, "admin_profile", None)
        if prof is None:
            prof = AdminProfile.objects.create(user=self.request.user, admin_role=AdminProfile.AdminRole.SUPER_ADMIN)
        return prof


class SubscriptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).order_by("-created_at")


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        ids = request.data.get("ids") or []
        if not isinstance(ids, list):
            return Response({"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Notification.objects.filter(user=request.user, id__in=ids).update(status=Notification.Status.READ)
        return Response({"updated": updated})


class ChatThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatThreadSerializer

    def get_queryset(self):
        uid = self.request.user.id
        qs = ChatThread.objects.all().order_by("-updated_at")
        return qs.filter(participants__contains=[uid])

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        participants = data.get("participants") or []
        if not isinstance(participants, list):
            return Response({"detail": "participants must be a list of user ids."}, status=status.HTTP_400_BAD_REQUEST)
        uid = request.user.id
        if uid not in participants:
            participants = [uid, *participants]
        data["participants"] = participants
        ser = self.get_serializer(data=data)
        ser.is_valid(raise_exception=True)
        thread = ser.save()
        return Response(self.get_serializer(thread).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        thread = self.get_object()
        uid = request.user.id
        if uid not in (thread.participants or []):
            return Response({"detail": "Not a participant."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == "GET":
            qs = ChatMessage.objects.filter(thread=thread).order_by("sent_at")
            return Response(ChatMessageSerializer(qs, many=True).data)

        msg = ChatMessage.objects.create(
            thread=thread,
            sender=request.user,
            content=(request.data.get("content") or ""),
            attachments=request.data.get("attachments") or [],
        )
        ChatThread.objects.filter(id=thread.id).update(updated_at=msg.sent_at)
        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.select_related("profile").all().order_by("-date_joined")
