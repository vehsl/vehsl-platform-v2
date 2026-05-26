import { BounceProvider } from "@/components/product/bounce-context";
import { ProductSelectionProvider } from "@/components/product/product-selection-context";
import { CartProvider } from "@/components/product/cart-context";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <BounceProvider>
      <ProductSelectionProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ProductSelectionProvider>
    </BounceProvider>
  );
}
