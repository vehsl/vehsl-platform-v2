import os
import random
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import AdminProfile, BuyerAddress, BuyerProfile, KycDocument, Notification, SellerProfile, User, UserProfile
from apps.catalog.models import Category, PricingTier, Product, ProductMedia, ProductVariation, ShippingRate
from apps.orders.models import CartItem, Order, OrderItem, Shipment, WishlistItem


@dataclass(frozen=True)
class CategorySpec:
    slug: str
    name: str
    subcategories: list[str]


@dataclass(frozen=True)
class SubcategorySeedSpec:
    name: str
    icon: str = ""
    items: list[str] = None


@dataclass(frozen=True)
class CategorySeedSpec:
    slug: str
    name: str
    accent: str = ""
    icon: str = ""
    subcategories: list[SubcategorySeedSpec] = None


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


def _load_categories_from_frontend(max_subcategories_per_category: int | None) -> list[CategorySeedSpec]:
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

    def find_enclosing_object(pos: int) -> tuple[int, int]:
        if pos < 0:
            return (-1, -1)
        start = pos
        while start >= 0 and text[start] != "{":
            start -= 1
        if start < 0:
            return (-1, -1)
        depth = 0
        i = start
        while i < len(text):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return (start, i + 1)
            i += 1
        return (-1, -1)

    def extract_string_prop(head: str, key: str) -> str:
        needle = f"{key}:"
        idx = head.find(needle)
        if idx < 0:
            return ""
        j = head.find('"', idx)
        if j < 0:
            return ""
        got = read_string_at(j)
        return got[0] if got else ""

    def extract_ident_prop(head: str, key: str) -> str:
        needle = f"{key}:"
        idx = head.find(needle)
        if idx < 0:
            return ""
        i = idx + len(needle)
        while i < len(head) and head[i] in {" ", "\t"}:
            i += 1
        out = []
        while i < len(head):
            ch = head[i]
            if not (ch.isalnum() or ch == "_"):
                break
            out.append(ch)
            i += 1
        return "".join(out).strip()

    def extract_array_block(s: str, key: str) -> str:
        pos = s.find(f"{key}:")
        if pos < 0:
            return ""
        arr_pos = s.find("[", pos)
        if arr_pos < 0:
            return ""
        depth = 0
        i = arr_pos
        while i < len(s):
            ch = s[i]
            if ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    return s[arr_pos : i + 1]
            i += 1
        return ""

    def parse_string_literals(arr_src: str) -> list[str]:
        out: list[str] = []
        i = 0
        while i < len(arr_src):
            if arr_src[i] != '"':
                i += 1
                continue
            got = read_string_at(i)
            if got:
                val, nxt = got
                if val.strip():
                    out.append(val.strip())
                i = nxt
                continue
            i += 1
        return out

    def parse_subcategories(block_src: str) -> list[SubcategorySeedSpec]:
        sub_arr = extract_array_block(block_src, "subcategories")
        if not sub_arr:
            return []
        subs: list[SubcategorySeedSpec] = []
        i = 0
        while i < len(sub_arr):
            if sub_arr[i] != "{":
                i += 1
                continue
            depth = 0
            j = i
            while j < len(sub_arr):
                if sub_arr[j] == "{":
                    depth += 1
                elif sub_arr[j] == "}":
                    depth -= 1
                    if depth == 0:
                        frag = sub_arr[i : j + 1]
                        name = extract_string_prop(frag, "name")
                        if name:
                            icon = extract_ident_prop(frag, "icon")
                            items_block = extract_array_block(frag, "items")
                            items = parse_string_literals(items_block) if items_block else []
                            subs.append(SubcategorySeedSpec(name=name, icon=icon, items=items))
                        i = j + 1
                        break
                j += 1
            else:
                break
            if max_subcategories_per_category is not None and len(subs) >= max_subcategories_per_category:
                return subs
        return subs

    out: list[CategorySeedSpec] = []
    for cid in ids:
        hit = find_category_block_start(cid)
        obj_start, obj_end = find_enclosing_object(hit)
        if obj_start < 0 or obj_end <= obj_start:
            out.append(CategorySeedSpec(slug=cid, name=cid.title(), accent="", icon="", subcategories=[]))
            continue
        block = text[obj_start:obj_end]
        head_end = block.find("subcategories:")
        head = block[:head_end] if head_end > 0 else block
        name = extract_string_prop(head, "name") or cid.title()
        accent = extract_string_prop(head, "accent")
        icon = extract_ident_prop(head, "icon")
        subs = parse_subcategories(block)
        out.append(CategorySeedSpec(slug=cid, name=name, accent=accent, icon=icon, subcategories=subs))
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
        parser.add_argument("--max-subcategories-per-category", type=int, default=9999)
        parser.add_argument("--sellers", type=int, default=1)
        parser.add_argument("--seller-email", type=str, default="seller@vehsl.local")
        parser.add_argument("--buyer-email", type=str, default="buyer@vehsl.local")
        parser.add_argument("--reset", action="store_true")
        parser.add_argument("--remove-seed-products", action="store_true")
        parser.add_argument("--with-kyc", action="store_true")

    def handle(self, *args, **options):
        seed = int(options["seed"])
        products_per_sub = max(0, int(options["products_per_subcategory"]))
        max_subs = options.get("max_subcategories_per_category")
        max_subs = None if max_subs is None else max(0, int(max_subs))
        sellers_n = max(1, int(options["sellers"]))
        seller_email = (options.get("seller_email") or "seller@vehsl.local").strip() or "seller@vehsl.local"
        buyer_email = (options.get("buyer_email") or "buyer@vehsl.local").strip() or "buyer@vehsl.local"
        reset = bool(options["reset"])
        remove_seed_products = bool(options["remove_seed_products"])
        with_kyc = bool(options["with_kyc"])

        rng = random.Random(seed)
        password = os.environ.get("SEED_DEFAULT_PASSWORD", "Test123!@#")

        try:
            raw_specs = _load_categories_from_frontend(max_subcategories_per_category=max_subs)
        except Exception:
            raw_specs = [
                CategorySeedSpec(
                    slug=s.slug,
                    name=s.name,
                    accent="",
                    icon="",
                    subcategories=[SubcategorySeedSpec(name=sub, icon="", items=[]) for sub in (s.subcategories or [])],
                )
                for s in FALLBACK_SPECS
            ]

        specs: list[CategorySeedSpec] = []
        for s in raw_specs:
            if not s or not getattr(s, "slug", ""):
                continue
            if s.slug.lower() == "other" or s.name.lower() == "other":
                continue
            seen: set[str] = set()
            subs: list[SubcategorySeedSpec] = []
            for sub in (s.subcategories or []):
                if not sub:
                    continue
                sub_name = (getattr(sub, "name", "") or "").strip()
                key = sub_name.lower()
                if not key or key == "other":
                    continue
                if key in seen:
                    continue
                seen.add(key)
                items = list(getattr(sub, "items", None) or [])
                subs.append(SubcategorySeedSpec(name=sub_name, icon=(getattr(sub, "icon", "") or ""), items=items))
                if max_subs is not None and len(subs) >= max_subs:
                    break
            specs.append(
                CategorySeedSpec(
                    slug=str(s.slug).strip(),
                    name=str(s.name).strip() or str(s.slug).title(),
                    accent=str(getattr(s, "accent", "") or "").strip(),
                    icon=str(getattr(s, "icon", "") or "").strip(),
                    subcategories=subs,
                )
            )

        with transaction.atomic():
            def cleanup_seed_products(should_return: bool):
                now = timezone.now()
                seeded_products = Product.objects.filter(sku__startswith="SEED-")
                seeded_ids = list(seeded_products.values_list("id", flat=True))
                cart_deleted = CartItem.objects.filter(product_id__in=seeded_ids).delete()[0] if seeded_ids else 0
                wishlist_deleted = WishlistItem.objects.filter(product_id__in=seeded_ids).delete()[0] if seeded_ids else 0
                tiers_deleted = PricingTier.objects.filter(product_id__in=seeded_ids).delete()[0] if seeded_ids else 0
                media_deleted = ProductMedia.objects.filter(product_id__in=seeded_ids).delete()[0] if seeded_ids else 0
                products_deleted = 0
                products_hidden = 0
                if seeded_ids:
                    try:
                        products_deleted = seeded_products.delete()[0]
                    except ProtectedError:
                        products_hidden = seeded_products.update(deleted_at=now, status=Product.Status.ARCHIVED)

                self.stdout.write(
                    self.style.SUCCESS(
                        "seed_catalog cleanup: "
                        f"products_deleted={products_deleted} products_hidden={products_hidden} "
                        f"media_deleted={media_deleted} tiers_deleted={tiers_deleted} "
                        f"cart_items_deleted={cart_deleted} wishlist_deleted={wishlist_deleted}"
                    )
                )
                if should_return:
                    return True
                return False

            if remove_seed_products:
                if cleanup_seed_products(should_return=True):
                    return

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
                email=os.environ.get("SEED_BUYER_EMAIL", buyer_email),
                role=User.Role.BUYER,
                account_type=User.AccountType.BUYER,
                password=password,
                first_name="Buyer",
                last_name="Seed",
            )

            sellers: list[User] = []
            primary_seller = _ensure_user(
                email=os.environ.get("SEED_SELLER_EMAIL", seller_email),
                role=User.Role.SELLER,
                account_type=User.AccountType.SELLER,
                password=password,
                first_name="Seller",
                last_name="Seed",
            )
            SellerProfile.objects.get_or_create(user=primary_seller)
            SellerProfile.objects.filter(user=primary_seller).update(
                verification_status=SellerProfile.VerificationStatus.APPROVED,
                country="US",
                region="TX",
                warehouse_location={"country": "US", "region": "TX", "city": "Austin"},
            )
            sellers.append(primary_seller)

            for i in range(max(0, sellers_n - 1)):
                email = os.environ.get(f"SEED_SELLER_{i+2}_EMAIL", f"seller{i+2}@vehsl.local")
                s = _ensure_user(
                    email=email,
                    role=User.Role.SELLER,
                    account_type=User.AccountType.SELLER,
                    password=password,
                    first_name=f"Seller{i+2}",
                    last_name="Seed",
                )
                SellerProfile.objects.get_or_create(user=s)
                SellerProfile.objects.filter(user=s).update(verification_status=SellerProfile.VerificationStatus.APPROVED)
                sellers.append(s)

            if with_kyc:
                _ensure_verified_kyc(buyer, reviewer=admin)
                for s in sellers:
                    _ensure_verified_kyc(s, reviewer=admin)

            BuyerAddress.objects.get_or_create(
                user=buyer,
                kind=BuyerAddress.Kind.PRIMARY,
                defaults={
                    "contact_name": "Buyer Seed",
                    "phone": "+1 555 0100",
                    "country": "US",
                    "region": "TX",
                    "city": "Austin",
                    "street1": "100 Seed St",
                    "street2": "",
                    "postal_code": "73301",
                },
            )
            BuyerAddress.objects.get_or_create(
                user=buyer,
                kind=BuyerAddress.Kind.SECONDARY,
                defaults={
                    "contact_name": "Buyer Seed",
                    "phone": "+1 555 0101",
                    "country": "US",
                    "region": "CA",
                    "city": "San Francisco",
                    "street1": "200 Seed Ave",
                    "street2": "",
                    "postal_code": "94105",
                },
            )

            if not ShippingRate.objects.filter(active=True).exists():
                ShippingRate.objects.create(
                    method=ShippingRate.Method.SEA,
                    origin_country="",
                    dest_country="",
                    currency="USD",
                    base_fee=Decimal("120.00"),
                    price_per_kg=Decimal("1.20"),
                    per_unit_fee=Decimal("0.10"),
                    transit_min_days=18,
                    transit_max_days=35,
                    active=True,
                )
                ShippingRate.objects.create(
                    method=ShippingRate.Method.AIR,
                    origin_country="",
                    dest_country="",
                    currency="USD",
                    base_fee=Decimal("80.00"),
                    price_per_kg=Decimal("4.50"),
                    per_unit_fee=Decimal("0.20"),
                    transit_min_days=5,
                    transit_max_days=12,
                    active=True,
                )
                ShippingRate.objects.create(
                    method=ShippingRate.Method.EXPRESS,
                    origin_country="",
                    dest_country="",
                    currency="USD",
                    base_fee=Decimal("40.00"),
                    price_per_kg=Decimal("7.50"),
                    per_unit_fee=Decimal("0.35"),
                    transit_min_days=2,
                    transit_max_days=5,
                    active=True,
                )

            if reset:
                cleanup_seed_products(should_return=False)

            top_map: dict[str, Category] = {}
            child_map: dict[tuple[str, str], Category] = {}

            for idx, spec in enumerate(specs):
                top, _ = Category.objects.get_or_create(
                    slug=spec.slug,
                    defaults={
                        "name": spec.name,
                        "accent": spec.accent or "",
                        "sort_order": 0,
                        "display_order": idx,
                        "parent": None,
                        "icon": spec.icon or "",
                    },
                )
                changed = False
                if top.name != spec.name:
                    top.name = spec.name
                    changed = True
                if (top.accent or "") != (spec.accent or ""):
                    top.accent = spec.accent or ""
                    changed = True
                if (top.icon or "") != (spec.icon or ""):
                    top.icon = spec.icon or ""
                    changed = True
                if int(getattr(top, "display_order", 0) or 0) != idx:
                    top.display_order = idx
                    changed = True
                if changed:
                    top.save(update_fields=["name", "accent", "icon", "display_order"])
                top_map[spec.slug] = top

                for sidx, sub in enumerate(spec.subcategories or []):
                    sub_name = (sub.name or "").strip()
                    if not sub_name or sub_name.lower() == "other":
                        continue
                    clean = sub_name
                    child_base = slugify(clean) or "subcategory"
                    child_slug = f"{top.slug}-{child_base}"[:96]
                    ch, _ = Category.objects.get_or_create(
                        slug=child_slug,
                        defaults={
                            "parent": top,
                            "name": clean,
                            "accent": spec.accent or "",
                            "sort_order": 0,
                            "display_order": sidx,
                            "icon": sub.icon or "",
                        },
                    )
                    changed = False
                    if ch.parent_id != top.id:
                        ch.parent = top
                        changed = True
                    if ch.name != clean:
                        ch.name = clean
                        changed = True
                    if (ch.accent or "") != (spec.accent or ""):
                        ch.accent = spec.accent or ""
                        changed = True
                    if (ch.icon or "") != (sub.icon or ""):
                        ch.icon = sub.icon or ""
                        changed = True
                    if int(getattr(ch, "display_order", 0) or 0) != sidx:
                        ch.display_order = sidx
                        changed = True
                    if changed:
                        ch.save(update_fields=["parent", "name", "accent", "icon", "display_order"])
                    child_map[(spec.slug, sub_name.lower())] = ch

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

            def _money(value: Decimal) -> Decimal:
                try:
                    return value.quantize(Decimal("0.01"))
                except Exception:
                    return value

            for spec in specs:
                top = top_map.get(spec.slug)
                if not top:
                    continue
                for sub in spec.subcategories or []:
                    sub_name = (sub.name or "").strip()
                    if not sub_name:
                        continue
                    cat = child_map.get((spec.slug, sub_name.lower()))
                    if not cat:
                        continue

                    names_pool = list(sub.items or [])
                    if not names_pool:
                        names_pool = [f"{sub_name} Item {i+1}" for i in range(max(1, products_per_sub))]

                    for n, item_name in enumerate(names_pool[: max(1, products_per_sub)]):
                        seller = primary_seller
                        base = f"{item_name}".strip()
                        title = f"{rng.choice(words)} {base}".strip()
                        sub_part = slugify(sub_name)[:10].upper() or "SUB"
                        item_part = slugify(item_name)[:10].upper() or "ITEM"
                        sku = f"SEED-{spec.slug.upper()}-{sub_part}-{item_part}-{n+1:03d}"[:64]
                        price = Decimal(rng.randint(25, 9000))
                        hs_code = f"{rng.randint(10, 99)}{rng.randint(10, 99)}.{rng.randint(10, 99)}"

                        weight_grams = rng.randint(150, 15000)
                        ship_min = rng.randint(2, 7)
                        ship_max = ship_min + rng.randint(0, 10)
                        sample_available = rng.random() < 0.35
                        sample_ship_days = rng.randint(2, 7)
                        lead_time_days = rng.randint(1, 30)
                        origin = {"country": "US", "region": "TX", "city": "Austin"}

                        detail_config = {
                            "specifications": [
                                {
                                    "title": "Quality",
                                    "collapsed": False,
                                    "items": [
                                        {"label": "Inspection", "value": "AQL 1.5 / 4.0"},
                                        {"label": "Warranty", "value": "12 months"},
                                        {"label": "Batch testing", "value": "Yes"},
                                    ],
                                },
                                {
                                    "title": "Logistics",
                                    "collapsed": False,
                                    "items": [
                                        {"label": "Incoterms", "value": "EXW / FOB / CIF"},
                                        {"label": "Packaging", "value": "Export standard carton + pallet"},
                                        {"label": "HS code", "value": hs_code},
                                    ],
                                },
                                {
                                    "title": "Production",
                                    "collapsed": True,
                                    "items": [
                                        {"label": "Lead time (days)", "value": str(lead_time_days)},
                                        {"label": "Origin", "value": f"{origin.get('city')}, {origin.get('region')}, {origin.get('country')}"},
                                    ],
                                },
                            ]
                        }

                        existing = Product.objects.filter(sku=sku, deleted_at__isnull=True).first()
                        if existing:
                            continue

                        p = Product.objects.create(
                            sku=sku,
                            seller=seller,
                            category=cat,
                            name=title[:160],
                            title=title[:200],
                            description=(
                                f"{title}. Seeded product for buyer/seller testing.\n"
                                f"Quality: inspection + warranty + batch testing.\n"
                                f"Logistics: tier pricing, shipping, packaging, and documents included."
                            ),
                            hs_code=hs_code,
                            currency="USD",
                            price=price,
                            status=Product.Status.ACTIVE,
                            lead_time_days=lead_time_days,
                            origin_location=origin,
                            weight_grams=weight_grams,
                            ship_time_min_days=ship_min,
                            ship_time_max_days=ship_max,
                            sample_available=sample_available,
                            sample_ship_days=sample_ship_days,
                            vehsl_rating=_money(Decimal(str(round(rng.uniform(3.6, 5.0), 2)))),
                            seller_rating=_money(Decimal(str(round(rng.uniform(3.6, 5.0), 2)))),
                            ip_protection_level=Product.IpProtectionLevel.LOW,
                            detail_config=detail_config,
                        )

                        created_products += 1

                        v_red = ProductVariation.objects.create(product=p, attributes={"Color": "Red"}, sku=f"{p.sku}-RED"[:64])
                        v_blue = ProductVariation.objects.create(product=p, attributes={"Color": "Blue"}, sku=f"{p.sku}-BLUE"[:64])

                        PricingTier.objects.create(product=p, variation=None, min_quantity=1, max_quantity=9, unit_price=_money(price), currency="USD")
                        PricingTier.objects.create(product=p, variation=None, min_quantity=10, max_quantity=99, unit_price=_money(price * Decimal("0.95")), currency="USD")
                        PricingTier.objects.create(product=p, variation=None, min_quantity=100, max_quantity=None, unit_price=_money(price * Decimal("0.90")), currency="USD")

                        PricingTier.objects.create(product=p, variation=v_red, min_quantity=1, max_quantity=9, unit_price=_money(price * Decimal("1.02")), currency="USD")
                        PricingTier.objects.create(product=p, variation=v_red, min_quantity=10, max_quantity=99, unit_price=_money(price * Decimal("0.97")), currency="USD")
                        PricingTier.objects.create(product=p, variation=v_red, min_quantity=100, max_quantity=None, unit_price=_money(price * Decimal("0.92")), currency="USD")

                        PricingTier.objects.create(product=p, variation=v_blue, min_quantity=1, max_quantity=9, unit_price=_money(price * Decimal("1.01")), currency="USD")
                        PricingTier.objects.create(product=p, variation=v_blue, min_quantity=10, max_quantity=99, unit_price=_money(price * Decimal("0.96")), currency="USD")
                        PricingTier.objects.create(product=p, variation=v_blue, min_quantity=100, max_quantity=None, unit_price=_money(price * Decimal("0.91")), currency="USD")

                        img0 = f"https://picsum.photos/seed/{p.sku}-0/800/600"
                        img1 = f"https://picsum.photos/seed/{p.sku}-1/800/600"
                        img2 = f"https://picsum.photos/seed/{p.sku}-2/800/600"
                        ProductMedia.objects.create(product=p, variation=None, media_type=ProductMedia.MediaType.IMAGE, url=img0, position=0)
                        ProductMedia.objects.create(product=p, variation=v_red, media_type=ProductMedia.MediaType.IMAGE, url=img1, position=1)
                        ProductMedia.objects.create(product=p, variation=v_blue, media_type=ProductMedia.MediaType.IMAGE, url=img2, position=2)
                        created_media += 3

                        ProductMedia.objects.create(
                            product=p,
                            variation=None,
                            media_type=ProductMedia.MediaType.DOCUMENT,
                            url=f"https://example.com/seed/{p.sku}/quality-certificate.pdf",
                            title="Quality certificate",
                            content_type="application/pdf",
                            size_bytes=0,
                            position=10,
                        )

                        if created_products % 5 == 0:
                            ProductMedia.objects.create(
                                product=p,
                                variation=None,
                                media_type=ProductMedia.MediaType.VIDEO,
                                url=f"https://picsum.photos/seed/{p.sku}-reel/1080/1920",
                                title="Behind the scenes",
                                content_type="video/mp4",
                                size_bytes=0,
                                position=20,
                            )

            if reset:
                Order.objects.filter(buyer=buyer, seller=primary_seller, items__product__sku__startswith="SEED-").delete()

            seed_products = list(
                Product.objects.filter(seller=primary_seller, deleted_at__isnull=True, sku__startswith="SEED-")
                .exclude(status=Product.Status.ARCHIVED)
                .order_by("id")[:6]
            )
            addr = BuyerAddress.objects.filter(user=buyer, kind=BuyerAddress.Kind.PRIMARY).first()
            ship_addr = {
                "contact_name": getattr(addr, "contact_name", "") or "",
                "phone": getattr(addr, "phone", "") or "",
                "country": getattr(addr, "country", "") or "",
                "region": getattr(addr, "region", "") or "",
                "city": getattr(addr, "city", "") or "",
                "street1": getattr(addr, "street1", "") or "",
                "street2": getattr(addr, "street2", "") or "",
                "postal_code": getattr(addr, "postal_code", "") or "",
            }

            def _create_order(*, product: Product, quantity: int, status: str, payment_method: str, payment_status: str, authorized: bool, shipped: bool):
                qty = max(1, int(quantity))
                unit_price = product.price
                total = unit_price * qty
                deadline = timezone.now() + timedelta(days=max(1, int(getattr(product, "ship_time_max_days", 3) or 3)))
                o = Order.objects.create(
                    buyer=buyer,
                    seller=primary_seller,
                    status=status,
                    currency=product.currency or "USD",
                    total_amount=total,
                    payment_method=payment_method,
                    payment_status=payment_status,
                    shipping_address=ship_addr,
                    deadline_at=deadline,
                    release_authorized_at=(timezone.now() if authorized else None),
                    release_authorized_by=(admin if authorized else None),
                )
                OrderItem.objects.create(order=o, product=product, variation=None, quantity=qty, unit_price=unit_price)
                if shipped:
                    Shipment.objects.create(
                        order=o,
                        carrier_id="seed",
                        tracking_number=f"SEED-TRK-{o.id}",
                        status=Shipment.Status.IN_TRANSIT,
                        origin="Seed Warehouse",
                        destination=f"{ship_addr.get('city')}, {ship_addr.get('country')}".strip(", "),
                    )
                return o

            if seed_products:
                _create_order(
                    product=seed_products[0],
                    quantity=150,
                    status=Order.Status.CREATED,
                    payment_method=Order.PaymentMethod.CARD,
                    payment_status=Order.PaymentStatus.UNPAID,
                    authorized=False,
                    shipped=False,
                )
                _create_order(
                    product=seed_products[min(1, len(seed_products) - 1)],
                    quantity=60,
                    status=Order.Status.ACCEPTED,
                    payment_method=Order.PaymentMethod.CARD,
                    payment_status=Order.PaymentStatus.PAID,
                    authorized=False,
                    shipped=False,
                )
                _create_order(
                    product=seed_products[min(2, len(seed_products) - 1)],
                    quantity=200,
                    status=Order.Status.SHIPPED,
                    payment_method=Order.PaymentMethod.COD,
                    payment_status=Order.PaymentStatus.COD_PENDING,
                    authorized=False,
                    shipped=True,
                )
                _create_order(
                    product=seed_products[min(3, len(seed_products) - 1)],
                    quantity=90,
                    status=Order.Status.SHIPPED,
                    payment_method=Order.PaymentMethod.CARD,
                    payment_status=Order.PaymentStatus.PAID,
                    authorized=True,
                    shipped=True,
                )

                Notification.objects.create(
                    user=primary_seller,
                    channel=Notification.Channel.IN_APP,
                    event_type="product_media_requested",
                    payload={"kind": "deal", "title": "product_media_requested", "tint": "#e67e22", "icon": "📦"},
                    status=Notification.Status.SENT,
                    sent_at=timezone.now(),
                )
                Notification.objects.create(
                    user=primary_seller,
                    channel=Notification.Channel.IN_APP,
                    event_type="new_order",
                    payload={"kind": "deal", "title": "New order received", "tint": "#0171e3", "icon": "🧾"},
                    status=Notification.Status.SENT,
                    sent_at=timezone.now(),
                )

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
