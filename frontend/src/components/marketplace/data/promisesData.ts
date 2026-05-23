import imgSellersVerified from "../../../assets/sellers-verified.png";
import imgManufacturingVisit from "../../../assets/manufacturing-visit.png";
import imgPaymentProtection from "../../../assets/payment-protection.png";
import imgCustomerSupport from "../../../assets/customer-support.png";
import imgBuyerKycVerified from "../../../assets/buyer-kyc-verified.png";

export interface PromiseItem {
  image: string | { src: string };
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
}

export const promisesData: PromiseItem[] = [
  {
    image: imgSellersVerified,
    titleEn: "100% Sellers verified.",
    titleZh: "100% 卖家已认证。",
    descriptionEn:
      "Every seller on our Vehsl is fully KYC-verified, ensuring you buy directly and securely from only verified sellers, no exceptions.",
    descriptionZh:
      "我们的 Vehsl 平台上的每位卖家都经过完整的 KYC 认证，确保您直接且安全地从经过验证的卖家处购买，绝无例外。",
  },

  {
    image: imgManufacturingVisit,
    titleEn: "Each manufacturing unit is visited.",
    titleZh: "实地探访每个制造工厂。",
    descriptionEn:
      "Every manufacturer on Vehsl is validated through in-person visits and careful review of their facility documents, ensuring credibility and transparency.",
    descriptionZh:
      "通过实地走访以及对设施文件的仔细审查，来核实 Vehsl 上的每家制造商，确保信誉与透明度。",
  },

  {
    image: imgPaymentProtection,
    titleEn: "Each Payment and product is protected.",
    titleZh: "每一笔付款与商品都受保护。",
    descriptionEn:
      "No payment moves without delivery, and no order is placed without secured funds.",
    descriptionZh:
      "未交货不付款，资金未安全托管不发单。",
  },

  {
    image: imgCustomerSupport,
    titleEn: "Questions at midnight? No problem. Our team is always online.",
    titleZh: "半夜有疑问？没问题。我们的团队始终在线。",
    descriptionEn:
      "Our global support team provides 24/7 assistance with orders, payments, listings, and more, expert help, wherever you are.",
    descriptionZh:
      "我们的全球支持团队全天候 (24/7) 提供订单、付款、商品列表等方面的协助，无论您身在何处，都能获得专家帮助。",
  },

  {
    image: imgBuyerKycVerified,
    titleEn: "Buyer KYC Verified.",
    titleZh: "买家 KYC 已验证。",
    descriptionEn:
      "Every buyer on our platform is verified through KYC to ensure secure and reliable marketplace.",
    descriptionZh:
      "平台上的每位买家都经过 KYC 验证，以确保安全可靠的市场环境。",
  },
];