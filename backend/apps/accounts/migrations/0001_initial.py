from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

import apps.accounts.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("email", models.EmailField(blank=True, max_length=254, null=True, unique=True)),
                ("phone", models.CharField(blank=True, max_length=20, null=True, unique=True, validators=[apps.accounts.models.phone_validator])),
                ("first_name", models.CharField(blank=True, max_length=150)),
                ("last_name", models.CharField(blank=True, max_length=150)),
                ("role", models.CharField(choices=[("buyer", "Buyer"), ("seller", "Seller"), ("admin", "Admin")], default="buyer", max_length=16)),
                ("account_type", models.CharField(blank=True, choices=[("buyer", "Buyer"), ("seller", "Seller")], max_length=16)),
                ("two_factor_enabled", models.BooleanField(default=False)),
                ("status", models.CharField(choices=[("active", "Active"), ("suspended", "Suspended"), ("deleted", "Deleted")], default="active", max_length=16)),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now)),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={},
            managers=[
                ("objects", apps.accounts.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("country", models.CharField(blank=True, max_length=64)),
                ("province", models.CharField(blank=True, max_length=64)),
                ("city", models.CharField(blank=True, max_length=64)),
                ("street", models.CharField(blank=True, max_length=128)),
                ("address", models.CharField(blank=True, max_length=256)),
                ("nationality", models.CharField(blank=True, max_length=64)),
                ("gender", models.CharField(blank=True, max_length=32)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="BuyerProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(blank=True, max_length=255)),
                ("business_type", models.CharField(blank=True, max_length=64)),
                ("default_location", models.JSONField(blank=True, default=dict)),
                ("currency_preference", models.CharField(blank=True, max_length=3)),
                ("language_preference", models.CharField(blank=True, max_length=16)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="buyer_profile", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="SellerProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("business_name", models.CharField(blank=True, max_length=255)),
                ("business_license_url", models.URLField(blank=True)),
                ("tax_id", models.CharField(blank=True, max_length=64)),
                ("verification_status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=16)),
                ("country", models.CharField(blank=True, max_length=64)),
                ("region", models.CharField(blank=True, max_length=64)),
                ("vehsl_rating", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ("sample_low_threshold", models.PositiveIntegerField(default=0)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="seller_profile", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="AdminProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("admin_role", models.CharField(choices=[("super_admin", "Super Admin"), ("compliance", "Compliance"), ("finance", "Finance"), ("support", "Support"), ("logistics", "Logistics")], max_length=32)),
                ("department", models.CharField(blank=True, max_length=64)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="admin_profile", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="Subscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("plan", models.CharField(choices=[("free", "Free"), ("pro", "Pro"), ("enterprise", "Enterprise")], default="free", max_length=16)),
                ("status", models.CharField(choices=[("active", "Active"), ("past_due", "Past Due"), ("canceled", "Canceled"), ("trialing", "Trialing")], default="active", max_length=16)),
                ("trial_ends_at", models.DateTimeField(blank=True, null=True)),
                ("current_period_end", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subscriptions", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("channel", models.CharField(choices=[("in_app", "In App"), ("email", "Email"), ("sms", "SMS"), ("push", "Push")], max_length=16)),
                ("event_type", models.CharField(max_length=64)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("status", models.CharField(choices=[("queued", "Queued"), ("sent", "Sent"), ("failed", "Failed"), ("read", "Read")], default="queued", max_length=16)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("actor_role", models.CharField(blank=True, max_length=32)),
                ("action", models.CharField(max_length=64)),
                ("target_type", models.CharField(max_length=64)),
                ("target_id", models.CharField(blank=True, max_length=64)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("occurred_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to="accounts.user")),
            ],
        ),
        migrations.CreateModel(
            name="ChatThread",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(choices=[("buyer_seller", "Buyer/Seller"), ("buyer_vehsl", "Buyer/Vehsl"), ("seller_vehsl", "Seller/Vehsl")], max_length=24)),
                ("participants", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="ChatMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("content", models.TextField(blank=True)),
                ("attachments", models.JSONField(blank=True, default=list)),
                ("sent_at", models.DateTimeField(auto_now_add=True)),
                ("read_by", models.JSONField(blank=True, default=list)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="chat_messages", to="accounts.user")),
                ("thread", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="accounts.chatthread")),
            ],
        ),
        migrations.AddIndex(
            model_name="sellerprofile",
            index=models.Index(fields=["verification_status"], name="accounts_se_verificat_764507_idx"),
        ),
        migrations.AddConstraint(
            model_name="sellerprofile",
            constraint=models.UniqueConstraint(condition=~models.Q(tax_id=""), fields=("tax_id",), name="uniq_seller_tax_id_nonempty"),
        ),
        migrations.AddIndex(
            model_name="subscription",
            index=models.Index(fields=["user", "status"], name="accounts_su_user_id_8c1f51_idx"),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["user", "status", "created_at"], name="accounts_no_user_id_0c0c3c_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["occurred_at"], name="accounts_au_occurre_e2f40b_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["actor", "occurred_at"], name="accounts_au_actor_i_d58c38_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["target_type", "target_id"], name="accounts_au_target__51b44c_idx"),
        ),
        migrations.AddIndex(
            model_name="chatthread",
            index=models.Index(fields=["type"], name="accounts_ch_type_88498e_idx"),
        ),
        migrations.AddIndex(
            model_name="chatmessage",
            index=models.Index(fields=["thread", "sent_at"], name="accounts_ch_thread__c81cda_idx"),
        ),
    ]
