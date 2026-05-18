import { OrderApp } from "@/components/order/OrderApp";

export const metadata = { title: "Orders · Vehsl" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderApp initialOrderId={id} />;
}
