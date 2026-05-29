import { ExploreShell } from "@/components/marketplace/ExploreShell";
import { CartProvider } from "@/components/product/cart-context";

export const metadata = { title: "Explore · Vehsl" };

export default function ExplorePage() {
  return (
    <CartProvider>
      <ExploreShell />
    </CartProvider>
  );
}
