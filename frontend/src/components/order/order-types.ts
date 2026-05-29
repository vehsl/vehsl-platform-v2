export type ApiOrderItem = {
  id: number;
  product: number;
  variation: number | null;
  product_name: string;
  specs?: string;
  image_url?: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type ApiOrder = {
  id: number;
  status: string;
  currency: string;
  total_amount: string;
  payment_method: string;
  payment_status: string;
  shipping_address: Record<string, any>;
  created_at: string;
  updated_at: string;
  items: ApiOrderItem[];
  latest_shipment: null | {
    id: number;
    status: string;
    tracking_number: string;
    estimated_delivery_at: string | null;
    actual_delivery_at: string | null;
  };
};

