from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def _release_proof_upload_to(instance, filename: str) -> str:
    base = filename.replace("\\", "_").replace("/", "_").strip() or "document"
    return f"release_proofs/order_{instance.condition.order_id}/cond_{instance.condition_id}/{base}"


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0002_remove_review_review_target_exactly_one_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="release_authorized_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="release_authorized_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="release_authorizations",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="ReleaseCondition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("inspection", "Inspection"),
                            ("lab_test", "Lab Test"),
                            ("certification", "Certification"),
                            ("documentation", "Documentation"),
                            ("photo_proof", "Photo Proof"),
                            ("custom", "Custom"),
                        ],
                        default="custom",
                        max_length=24,
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("in_progress", "In Progress"),
                            ("satisfied", "Satisfied"),
                            ("waived", "Waived"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=24,
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[("critical", "Critical"), ("required", "Required"), ("optional", "Optional")],
                        default="required",
                        max_length=16,
                    ),
                ),
                ("due_at", models.DateField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("satisfied_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "order",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="release_conditions", to="orders.order"),
                ),
                (
                    "satisfied_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="release_conditions_satisfied",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["order", "status"], name="orders_rele_order_i_1c2c83_idx"),
                    models.Index(fields=["status", "created_at"], name="orders_rele_status_32b474_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ReleaseConditionProof",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to=_release_proof_upload_to)),
                ("original_name", models.CharField(blank=True, max_length=255)),
                ("size_bytes", models.PositiveIntegerField(default=0)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "condition",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="proofs", to="orders.releasecondition"),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["condition", "uploaded_at"], name="orders_rele_conditi_6cbf7f_idx"),
                ],
            },
        ),
    ]

