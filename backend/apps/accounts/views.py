from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller

from .models import AdminProfile, ChatMessage, ChatThread, Notification, Subscription, User, UserProfile
from .serializers import (
    AdminProfileUpdateSerializer,
    AdminUserListSerializer,
    AdminUserWriteSerializer,
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
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        qs = (
            User.objects.select_related("profile", "seller_profile", "admin_profile")
            .annotate(
                orders_count=Count("orders", distinct=True) + Count("sales", distinct=True),
            )
            .order_by("-date_joined")
        )

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )

        role = (self.request.query_params.get("role") or "").strip().lower()
        if role in {"buyer", "seller", "admin", "partner"}:
            qs = qs.filter(role=role)

        active_now = (self.request.query_params.get("active_now") or "").strip().lower()
        if active_now in {"1", "true", "yes"}:
            window = timezone.now() - timedelta(minutes=15)
            qs = qs.filter(last_login__gte=window)

        admin_role = (self.request.query_params.get("admin_role") or "").strip().lower()
        if admin_role:
            if admin_role == "manager":
                qs = qs.filter(role=User.Role.ADMIN).exclude(admin_profile__admin_role=AdminProfile.AdminRole.SUPER_ADMIN)
            else:
                qs = qs.filter(role=User.Role.ADMIN, admin_profile__admin_role=admin_role)

        admin_status = (self.request.query_params.get("admin_status") or "").strip().lower()
        if admin_status == "suspended":
            qs = qs.filter(status=User.Status.SUSPENDED)
        elif admin_status == "pending":
            qs = qs.filter(status=User.Status.ACTIVE, seller_profile__verification_status="pending")
        elif admin_status == "review":
            qs = qs.filter(status=User.Status.ACTIVE, seller_profile__verification_status="rejected")
        elif admin_status == "active":
            qs = qs.exclude(status=User.Status.SUSPENDED)

        return qs

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return AdminUserWriteSerializer
        return AdminUserListSerializer

    def create(self, request, *args, **kwargs):
        ser = AdminUserWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        email = (data.get("email") or "").strip() or None
        phone = (data.get("phone") or "").strip() or None
        password = (data.get("password") or "").strip()
        role = data.get("role")
        account_type = (data.get("account_type") or "").strip()
        status_val = data.get("status") or User.Status.ACTIVE
        admin_role = (data.get("admin_role") or "").strip()
        department = (data.get("department") or "").strip()

        user = User(
            email=email,
            phone=phone,
            first_name=(data.get("first_name") or "").strip(),
            last_name=(data.get("last_name") or "").strip(),
            role=role,
            account_type=account_type,
            status=status_val,
            is_active=True,
        )
        user.set_password(password or "Test123!@#")
        user.full_clean()
        user.save()

        UserProfile.objects.get_or_create(user=user)
        if role == User.Role.SELLER:
            from .models import SellerProfile

            SellerProfile.objects.get_or_create(user=user)
        if role == User.Role.BUYER:
            from .models import BuyerProfile

            BuyerProfile.objects.get_or_create(user=user)
        if role == User.Role.ADMIN:
            role_val = admin_role or AdminProfile.AdminRole.SUPER_ADMIN
            prof, _ = AdminProfile.objects.get_or_create(user=user, defaults={"admin_role": role_val})
            updates = {}
            if admin_role and prof.admin_role != admin_role:
                updates["admin_role"] = admin_role
            if department and prof.department != department:
                updates["department"] = department
            if updates:
                AdminProfile.objects.filter(id=prof.id).update(**updates)

        out = AdminUserListSerializer(user, context=self.get_serializer_context()).data
        return Response(out, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        user = self.get_object()
        ser = AdminUserWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        for f in ["first_name", "last_name"]:
            if f in data:
                setattr(user, f, (data.get(f) or "").strip())
        if "email" in data:
            user.email = (data.get("email") or "").strip() or None
        if "phone" in data:
            user.phone = (data.get("phone") or "").strip() or None
        if "role" in data:
            user.role = data.get("role")
        if "account_type" in data:
            user.account_type = (data.get("account_type") or "").strip()
        if "status" in data:
            user.status = data.get("status")
        if "password" in data and (data.get("password") or "").strip():
            user.set_password((data.get("password") or "").strip())

        user.full_clean()
        user.save()

        UserProfile.objects.get_or_create(user=user)
        if user.role == User.Role.ADMIN:
            AdminProfile.objects.get_or_create(user=user, defaults={"admin_role": AdminProfile.AdminRole.SUPER_ADMIN})
        if user.role == User.Role.ADMIN and ("admin_role" in data or "department" in data):
            prof, _ = AdminProfile.objects.get_or_create(user=user, defaults={"admin_role": AdminProfile.AdminRole.SUPER_ADMIN})
            updates = {}
            if "admin_role" in data and (data.get("admin_role") or "").strip():
                updates["admin_role"] = (data.get("admin_role") or "").strip()
            if "department" in data:
                updates["department"] = (data.get("department") or "").strip()
            if updates:
                AdminProfile.objects.filter(id=prof.id).update(**updates)
        out = AdminUserListSerializer(user, context=self.get_serializer_context()).data
        return Response(out)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        total_users = User.objects.count()
        suspended = User.objects.filter(status=User.Status.SUSPENDED).count()
        pending_review = User.objects.filter(status=User.Status.ACTIVE, seller_profile__verification_status="pending").count()
        review = User.objects.filter(status=User.Status.ACTIVE, seller_profile__verification_status="rejected").count()
        active = (
            User.objects.exclude(status=User.Status.SUSPENDED)
            .exclude(status=User.Status.DELETED)
            .filter(Q(seller_profile__isnull=True) | ~Q(seller_profile__verification_status__in=["pending", "rejected"]))
            .count()
        )

        return Response(
            {
                "total_users": total_users,
                "active": active,
                "pending_review": pending_review,
                "review": review,
                "suspended": suspended,
            }
        )
