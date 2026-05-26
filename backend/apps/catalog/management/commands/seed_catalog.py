import os
import random
from dataclasses import dataclass
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import AdminProfile, BuyerProfile, KycDocument, SellerProfile, User, UserProfile
from apps.catalog.models import Category, Product, ProductMedia


@dataclass(frozen=True)
class CategorySpec:
    slug: str
    name: str
    subcategories: list[str]

FALLBACK_SPECS: list[CategorySpec] = [
    CategorySpec(
        slug="vehicles",
        name="Vehicles",
        subcategories=[
            "SUV",
            "Electric",
            "Accessories",
            "Heavy Vehicles",
            "Bike",
            "E Bikes",
            "Ships",
            "Helicopters",
            "Drones",
            "Auto Parts",
        ],
    ),
    CategorySpec(
        slug="industrial",
        name="Industrial",
        subcategories=[
            "Industrial Machines",
            "Raw Materials",
            "Industrial Chemicals",
            "Packaging",
            "Safety Gear",
            "Power Tools",
            "Construction Equipment",
            "Factory Automation",
        ],
    ),
    CategorySpec(
        slug="hardware",
        name="Hardware",
        subcategories=[
            "Hand Tools",
            "Power Tools",
            "Fasteners",
            "Plumbing",
            "Electrical",
            "Paint & Finish",
            "Lumber",
            "Adhesives",
        ],
    ),
    CategorySpec(
        slug="electronics",
        name="Electronics",
        subcategories=[
            "Laptops",
            "Phones",
            "Tablets",
            "Cameras",
            "Audio",
            "Drones",
            "Gaming",
            "Accessories",
        ],
    ),
    CategorySpec(
        slug="furniture",
        name="Furniture",
        subcategories=[
            "Sofas",
            "Tables",
            "Chairs",
            "Beds",
            "Storage",
            "Outdoor",
            "Office",
            "Lighting",
        ],
    ),
    CategorySpec(
        slug="energy",
        name="Energy",
        subcategories=[
            "Solar Systems",
            "Batteries",
            "Inverters",
            "Wind Energy",
            "Generators",
            "EV Charging",
        ],
    ),
    CategorySpec(
        slug="apparel",
        name="Apparel",
        subcategories=[
            "Men's Wear",
            "Women's Wear",
            "Kids",
            "Shoes",
            "Bags",
            "Sportswear",
            "Formal",
            "Accessories",
            "Fabrics",
        ],
    ),
    CategorySpec(
        slug="beauty",
        name="Beauty",
        subcategories=[
            "Skincare",
            "Makeup",
            "Hair Care",
            "Fragrance",
            "Nail",
            "Wellness",
        ],
    ),
    CategorySpec(
        slug="mining",
        name="Mining",
        subcategories=[
            "Industrial Minerals",
            "Metal Ores",
            "Excavation",
            "Drilling Equipment",
            "Processing",
            "Safety",
        ],
    ),
    CategorySpec(
        slug="agriculture",
        name="Agriculture",
        subcategories=[
            "Grains",
            "Fruits",
            "Vegetables",
            "Seeds",
            "Fertilizers",
            "Agricultural Machinery",
            "Livestock & Farming",
        ],
    ),
    CategorySpec(
        slug="sports",
        name="Sports",
        subcategories=[
            "Sports Equipment",
            "Fitness Equipment",
            "Outdoor Gear",
            "Racquet Sports",
            "Winter Sports",
            "Sports Accessories",
        ],
    ),
]


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    return here.parents[5]


def _load_categories_from_frontend(max_subcategories_per_category: int | None) -> list[CategorySpec]:
    src = _repo_root() / "frontend" / "src" / "lib" / "categories.ts"
    if not src.exists():
        raise FileNotFoundError(str(src))

    text = src.read_text(encoding="utf-8", errors="ignore")

    ids = [
        "vehicles",
        "industrial",
        "hardware",
        "electronics",
        "furniture",
        "energy",
        "apparel",
        "beauty",
        "mining",
        "agriculture",
        "sports",
    ]

    def read_string_at(i: int) -> tuple[str, int] | None:
        if i >= len(text) or text[i] != '"':
            return None
        i += 1
        out = []
        while i < len(text):
            ch = text[i]
            if ch == "\\" and i + 1 < len(text):
                out.append(text[i + 1])
                i += 2
                continue
            if ch == '"':
                return ("".join(out), i + 1)
            out.append(ch)
            i += 1
        return None

    def find_category_block_start(cat_id: str) -> int:
        needle = f'id: "{cat_id}"'
        pos = text.find(needle)
        if pos < 0:
            needle = f"id: '{cat_id}'"
            pos = text.find(needle)
        return pos

    def extract_category_name(block_start: int) -> str:
        if block_start < 0:
            return ""
        sub_pos = text.find("subcategories:", block_start)
        if sub_pos < 0:
            return ""
        head = text[block_start:sub_pos]
        idx = head.find("name:")
        if idx < 0:
            return ""
        j = head.find('"', idx)
        if j < 0:
            return ""
        got = read_string_at(block_start + idx + (j - idx))
        return got[0] if got else ""

    def extract_subcategories(block_start: int) -> list[str]:
        if block_start < 0:
            return []
        sub_pos = text.find("subcategories:", block_start)
        if sub_pos < 0:
            return []
        arr_pos = text.find("[", sub_pos)
        if arr_pos < 0:
            return []

        names: list[str] = []
        i = arr_pos + 1
        bracket_depth = 1
        in_string = False
        escape = False
        while i < len(text) and bracket_depth > 0:
            ch = text[i]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                i += 1
                continue

            if ch == '"':
                in_string = True
                i += 1
                continue
            if ch == "[":
                bracket_depth += 1
                i += 1
                continue
            if ch == "]":
                bracket_depth -= 1
                i += 1
                continue

            if bracket_depth >= 1 and text.startswith("name:", i):
                j = i + 5
                while j < len(text) and text[j] in {" ", "\t"}:
                    j += 1
                if j < len(text) and text[j] == '"':
                    got = read_string_at(j)
                    if got:
                        names.append(got[0])
                        if max_subcategories_per_category is not None and len(names) >= max_subcategories_per_category:
                            return names
                        i = got[1]
                        continue
            i += 1
        return names

    out: list[CategorySpec] = []
    for cid in ids:
        start = find_category_block_start(cid)
        name = extract_category_name(start) or cid.title()
        raw_subs = extract_subcategories(start)
        seen: set[str] = set()
        subs: list[str] = []
        for s in raw_subs:
            key = s.strip().lower()
            if not key or key == "other":
                continue
            if key in seen:
                continue
            seen.add(key)
            subs.append(s.strip())
            if max_subcategories_per_category is not None and len(subs) >= max_subcategories_per_category:
                break
        out.append(CategorySpec(slug=cid, name=name, subcategories=subs))
    return out


def _ensure_user(email: str, role: str, account_type: str, password: str, first_name: str, last_name: str) -> User:
    u, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "account_type": account_type,
            "is_staff": role == User.Role.ADMIN,
            "is_superuser": False,
            "is_active": True,
        },
    )
    u.first_name = first_name
    u.last_name = last_name
    u.role = role
    u.account_type = account_type
    u.is_active = True
    if role == User.Role.ADMIN:
        u.is_staff = True
    u.set_password(password)
    u.save()
    UserProfile.objects.get_or_create(user=u)
    if account_type == User.AccountType.BUYER:
        BuyerProfile.objects.get_or_create(user=u)
    if account_type == User.AccountType.SELLER:
        SellerProfile.objects.get_or_create(user=u)
    return u


def _ensure_verified_kyc(user: User, reviewer: User | None):
    role = (getattr(user, "account_type", "") or getattr(user, "role", "") or "").lower()
    is_seller = role == "seller"
    required_kinds = [KycDocument.Kind.PASSPORT, KycDocument.Kind.UTILITY_BILL]
    if is_seller:
        required_kinds = [
            KycDocument.Kind.PASSPORT,
            KycDocument.Kind.ID_CARD,
            KycDocument.Kind.UTILITY_BILL,
            KycDocument.Kind.BUSINESS_REGISTRATION,
            KycDocument.Kind.BUSINESS_LICENSE,
        ]

    for kind in required_kinds:
        exists = KycDocument.objects.filter(user=user, kind=kind, review_status=KycDocument.ReviewStatus.VERIFIED).exists()
        if exists:
            continue
        doc = KycDocument(
            user=user,
            kind=kind,
            doc_type=str(kind),
            review_status=KycDocument.ReviewStatus.VERIFIED,
            reviewed_at=timezone.now(),
            reviewed_by=reviewer,
            original_name=f"{kind}.txt",
            content_type="text/plain",
            size_bytes=0,
        )
        doc.file.save(f"{kind}.txt", ContentFile(b"seed"), save=False)
        doc.size_bytes = int(getattr(doc.file, "size", 0) or 0)
        doc.save()

    if is_seller:
        SellerProfile.objects.get_or_create(user=user)
        SellerProfile.objects.filter(user=user).update(verification_status=SellerProfile.VerificationStatus.APPROVED)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument("--products-per-subcategory", type=int, default=8)
        parser.add_argument("--max-subcategories-per-category", type=int, default=9)
        parser.add_argument("--sellers", type=int, default=3)
        parser.add_argument("--reset", action="store_true")
        parser.add_argument("--with-kyc", action="store_true")

    def handle(self, *args, **options):
        seed = int(options["seed"])
        products_per_sub = max(0, int(options["products_per_subcategory"]))
        max_subs = options.get("max_subcategories_per_category")
        max_subs = None if max_subs is None else max(0, int(max_subs))
        sellers_n = max(1, int(options["sellers"]))
        reset = bool(options["reset"])
        with_kyc = bool(options["with_kyc"])

        rng = random.Random(seed)
        password = os.environ.get("SEED_DEFAULT_PASSWORD", "Test123!@#")

        try:
            specs = _load_categories_from_frontend(max_subcategories_per_category=max_subs)
        except Exception:
            specs = FALLBACK_SPECS

        specs = [s for s in specs if s.slug.lower() != "other" and s.name.lower() != "other"]
        normalized: list[CategorySpec] = []
        for s in specs:
            seen: set[str] = set()
            subs: list[str] = []
            for sub in s.subcategories:
                key = sub.strip().lower()
                if not key or key == "other":
                    continue
                if key in seen:
                    continue
                seen.add(key)
                subs.append(sub.strip())
                if max_subs is not None and len(subs) >= max_subs:
                    break
            normalized.append(CategorySpec(slug=s.slug, name=s.name, subcategories=subs))
        specs = normalized

        with transaction.atomic():
            admin = _ensure_user(
                email=os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@vehsl.local"),
                role=User.Role.ADMIN,
                account_type=User.AccountType.BUYER,
                password=password,
                first_name="Admin",
                last_name="Seed",
            )
            AdminProfile.objects.get_or_create(user=admin, defaults={"admin_role": AdminProfile.AdminRole.SUPER_ADMIN, "department": ""})

            buyer = _ensure_user(
                email=os.environ.get("SEED_BUYER_EMAIL", "buyer@vehsl.local"),
                role=User.Role.BUYER,
                account_type=User.AccountType.BUYER,
                password=password,
                first_name="Buyer",
                last_name="Seed",
            )

            sellers: list[User] = []
            for i in range(sellers_n):
                email = os.environ.get(f"SEED_SELLER_{i+1}_EMAIL", f"seller{i+1}@vehsl.local")
                s = _ensure_user(
                    email=email,
                    role=User.Role.SELLER,
                    account_type=User.AccountType.SELLER,
                    password=password,
                    first_name=f"Seller{i+1}",
                    last_name="Seed",
                )
                SellerProfile.objects.get_or_create(user=s)
                SellerProfile.objects.filter(user=s).update(verification_status=SellerProfile.VerificationStatus.APPROVED)
                sellers.append(s)

            if with_kyc:
                _ensure_verified_kyc(buyer, reviewer=admin)
                for s in sellers:
                    _ensure_verified_kyc(s, reviewer=admin)

            if reset:
                ProductMedia.objects.filter(product__sku__startswith="SEED-").delete()
                Product.objects.filter(sku__startswith="SEED-").delete()

            top_map: dict[str, Category] = {}
            child_map: dict[tuple[str, str], Category] = {}

            for spec in specs:
                top, _ = Category.objects.get_or_create(
                    slug=spec.slug,
                    defaults={
                        "name": spec.name,
                        "accent": "",
                        "sort_order": 0,
                        "display_order": 0,
                        "parent": None,
                    },
                )
                if top.name != spec.name:
                    top.name = spec.name
                    top.save(update_fields=["name"])
                top_map[spec.slug] = top

                for sub_name in spec.subcategories:
                    if not sub_name or sub_name.strip().lower() == "other":
                        continue
                    clean = sub_name.strip()
                    child_base = slugify(clean) or "subcategory"
                    child_slug = f"{top.slug}-{child_base}"[:96]
                    ch, _ = Category.objects.get_or_create(
                        slug=child_slug,
                        defaults={"parent": top, "name": clean, "accent": "", "sort_order": 0, "display_order": 0, "icon": ""},
                    )
                    changed = False
                    if ch.parent_id != top.id:
                        ch.parent = top
                        changed = True
                    if ch.name != clean:
                        ch.name = clean
                        changed = True
                    if changed:
                        ch.save(update_fields=["parent", "name"])
                    child_map[(spec.slug, sub_name.strip().lower())] = ch

            words = [
                "Premium",
                "Industrial",
                "Heavy-Duty",
                "Compact",
                "Eco",
                "Smart",
                "Portable",
                "Pro",
                "Ultra",
                "Series",
                "Gen",
                "Plus",
                "Max",
            ]

            created_products = 0
            created_media = 0

            for spec in specs:
                top = top_map.get(spec.slug)
                if not top:
                    continue
                for sub_name in spec.subcategories:
                    sub_key = sub_name.strip().lower()
                    cat = child_map.get((spec.slug, sub_key))
                    if not cat:
                        continue
                    for n in range(products_per_sub):
                        seller = sellers[(created_products + n) % len(sellers)]
                        base = f"{spec.name} {sub_name}".strip()
                        title = f"{rng.choice(words)} {base} {rng.randint(100, 999)}"
                        sku = f"SEED-{spec.slug.upper()}-{slugify(sub_name)[:10].upper()}-{rng.randint(100000, 999999)}"
                        price = rng.randint(10, 5000)
                        hs_code = f"{rng.randint(10, 99)}{rng.randint(10, 99)}.{rng.randint(10, 99)}"

                        p, was_created = Product.objects.get_or_create(
                            sku=sku,
                            defaults={
                                "seller": seller,
                                "category": cat,
                                "name": title[:160],
                                "title": title[:200],
                                "description": f"{title} for testing admin/seller/buyer APIs.",
                                "hs_code": hs_code,
                                "currency": "USD",
                                "price": price,
                                "status": Product.Status.ACTIVE,
                                "lead_time_days": rng.randint(1, 30),
                                "origin_location": {"country": "US", "city": "Austin"},
                                "vehsl_rating": round(rng.uniform(3.6, 5.0), 2),
                                "seller_rating": round(rng.uniform(3.6, 5.0), 2),
                                "ip_protection_level": Product.IpProtectionLevel.LOW,
                            },
                        )
                        if not was_created:
                            continue

                        created_products += 1
                        for pos in range(3):
                            img_url = f"https://picsum.photos/seed/{p.sku}-{pos}/800/600"
                            ProductMedia.objects.create(product=p, media_type=ProductMedia.MediaType.IMAGE, url=img_url, position=pos)
                            created_media += 1

        self.stdout.write(self.style.SUCCESS(f"seed_catalog: sellers={sellers_n} products_created={created_products} media_created={created_media}"))
        self.stdout.write(self.style.SUCCESS(f"seed_catalog password: {password}"))

        base_products = Product.objects.filter(deleted_at__isnull=True, status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])
        counts = {row["category_id"]: row["c"] for row in base_products.values("category_id").annotate(c=Count("id"))}
        top_qs = Category.objects.filter(parent__isnull=True, deleted_at__isnull=True).exclude(Q(slug__iexact="other") | Q(name__iexact="other"))
        child_qs = Category.objects.filter(parent__isnull=False, deleted_at__isnull=True).exclude(Q(slug__iexact="other") | Q(name__iexact="other"))
        children_by_parent: dict[int, list[Category]] = {}
        for ch in child_qs.order_by("parent_id", "display_order", "sort_order", "name"):
            children_by_parent.setdefault(int(ch.parent_id), []).append(ch)

        self.stdout.write(self.style.SUCCESS("category_counts:"))
        for top in top_qs.order_by("display_order", "sort_order", "name"):
            subtotal = int(counts.get(top.id, 0) or 0)
            children = children_by_parent.get(int(top.id), [])
            for ch in children:
                subtotal += int(counts.get(ch.id, 0) or 0)
            self.stdout.write(f"- {top.name} ({subtotal})")
            for ch in children[: max_subs or 9999]:
                self.stdout.write(f"  - {ch.name} ({int(counts.get(ch.id, 0) or 0)})")
