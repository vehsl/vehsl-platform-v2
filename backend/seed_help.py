import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from apps.accounts.models import HelpArticle

def seed():
    articles = [
        # Getting Started
        {
            "category": HelpArticle.Category.GETTING_STARTED,
            "title": "How selling on Vehsl works",
            "description": "Overview of the seller experience.",
            "body": ["Vehsl connects verified sellers with global buyers. Every product goes through quality assurance before delivery.", "We handle inspections, secure payments, and worldwide logistics."],
            "steps": ["Complete your seller profile", "Upload business certifications", "List your first product", "Pass quality inspection", "Start receiving orders"],
            "tip": "Verified sellers with all certifications get 3x more buyer trust."
        },
        {
            "category": HelpArticle.Category.GETTING_STARTED,
            "title": "Setting up your store",
            "description": "Configure your manufacturing profile.",
            "body": ["Add your factory details, production capabilities, certifications, and payout accounts."],
            "steps": ["Go to Settings > Business", "Add your business details", "Upload ISO/GMP certificates", "Set production capacity and lead times", "Add payout bank accounts"],
            "tip": "Complete profiles get priority in search results."
        },
        # Payouts
        {
            "category": HelpArticle.Category.PAYOUTS,
            "title": "Payout schedule",
            "description": "When and how you get paid.",
            "body": ["Payouts are processed after buyer confirmation. Standard processing takes 3-5 business days."],
            "steps": ["Order delivered and confirmed", "Payout initiated automatically", "Processing (3-5 business days)", "Deposited to your default account", "Receipt available in earnings"],
            "tip": "Large orders ($10K+) may have an additional verification step."
        },
        # Shipping
        {
            "category": HelpArticle.Category.SHIPPING,
            "title": "International shipping",
            "description": "Cross-border logistics explained.",
            "body": ["Vehsl partners with global logistics providers. We handle customs documentation."],
            "steps": ["Order confirmed", "Shipping method selected", "Pickup arranged", "Customs clearance handled", "Delivery tracking active"],
            "tip": "DDP shipments have higher buyer satisfaction."
        }
    ]

    for a in articles:
        HelpArticle.objects.get_or_create(
            category=a["category"],
            title=a["title"],
            defaults={
                "description": a["description"],
                "body": a["body"],
                "steps": a["steps"],
                "tip": a["tip"]
            }
        )
    print(f"Seeded {len(articles)} help articles.")

if __name__ == "__main__":
    seed()
