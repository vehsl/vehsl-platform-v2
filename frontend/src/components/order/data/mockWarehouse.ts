export interface Warehouse {
  id: string;
  name: string;
  address: string;
  distance: string;
  pricePerWeek: number;
  rating: string;
  features: ('climate' | 'security' | 'covered')[];
  storedSince?: string;
  hours?: { open: string; close: string; days: string } | '24/7';
  managerName: string;
  managerPhone: string;
}

export interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  image: string;
  totalBoxes: number;
  releasedBoxes: number;
  palletsCount: number;
  unitPrice: number;
  warehouseId: string;
}

export interface ReleaseRequest {
  id: string;
  orderId?: string;
  warehouseId?: string;
  inventoryItemId: string;
  requesterName: string;
  idCardNumber: string;
  vehicleNumber: string;
  boxesRequested: number;
  paymentAmount: number;
  requestedDate: string;
  note?: string;
}

export interface ReleaseRecord {
  id: string;
  orderId?: string;
  warehouseId?: string;
  inventoryItemId: string;
  recipientName: string;
  idCardNumber: string;
  vehicleNumber: string;
  boxesReleased: number;
  paymentAmount: number;
  date: string;
  status: 'completed' | 'pending';
}
