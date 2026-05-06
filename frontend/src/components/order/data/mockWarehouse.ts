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
  inventoryItemId: string;
  recipientName: string;
  idCardNumber: string;
  vehicleNumber: string;
  boxesReleased: number;
  paymentAmount: number;
  date: string;
  status: 'completed' | 'pending';
}

export const mockWarehouses: Warehouse[] = [
  {
    id: 'w1',
    name: 'Greenstore G1 warehouse',
    address: '123 Green Street, Lahore',
    distance: '1.2 miles away',
    pricePerWeek: 35,
    rating: 'A',
    features: ['climate', 'security', 'covered'],
    storedSince: '2026-01-20',
    hours: { open: '08:00', close: '18:00', days: 'Mon–Sat' },
    managerName: 'John Doe',
    managerPhone: '0300-1234567',
  },
  {
    id: 'w2',
    name: 'James ZS warehouse',
    address: '456 James Street, Islamabad',
    distance: '4 miles away',
    pricePerWeek: 45,
    rating: 'A+',
    features: ['climate', 'security', 'covered'],
    storedSince: '2026-01-06',
    hours: { open: '07:00', close: '22:00', days: 'Mon–Sun' },
    managerName: 'Jane Smith',
    managerPhone: '0300-7654321',
  },
  {
    id: 'w3',
    name: 'Jack Rock warehouse',
    address: '789 Jack Street, Karachi',
    distance: '7 miles away',
    pricePerWeek: 50,
    rating: 'B',
    features: ['climate', 'security', 'covered'],
    hours: '24/7',
    managerName: 'Alice Johnson',
    managerPhone: '0300-1122334',
  },
  {
    id: 'w4',
    name: 'Junaid Logistics Center',
    address: '101 Junaid Street, Rawalpindi',
    distance: '10 miles away',
    pricePerWeek: 55,
    rating: 'A++',
    features: ['climate', 'security', 'covered'],
    hours: { open: '06:00', close: '23:00', days: 'Mon–Sun' },
    managerName: 'Bob Brown',
    managerPhone: '0300-4433221',
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv1',
    productName: 'Alex USB C Wire — Green 2m',
    sku: 'USB-C-GRN-2M',
    image: 'https://images.unsplash.com/photo-1639675960002-2f414c58ed79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2IlMjBjJTIwY2FibGUlMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzY5Njg4ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    totalBoxes: 120,
    releasedBoxes: 34,
    palletsCount: 6,
    unitPrice: 32.00,
    warehouseId: 'w2',
  },
  {
    id: 'inv2',
    productName: 'Alex USB C Wire — White 1m',
    sku: 'USB-C-WHT-1M',
    image: 'https://images.unsplash.com/photo-1561015314-6bd8c1e875ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2IlMjBjYWJsZSUyMHByb2R1Y3QlMjBwYWNrYWdpbmclMjB3aGl0ZXxlbnwxfHx8fDE3NzA2NTc1MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    totalBoxes: 80,
    releasedBoxes: 12,
    palletsCount: 4,
    unitPrice: 32.00,
    warehouseId: 'w2',
  },
  {
    id: 'inv3',
    productName: 'Wireless NC Headphones',
    sku: 'WNC-HP-BLK',
    image: 'https://images.unsplash.com/photo-1624564039739-035817ba4098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3Njk2ODg4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    totalBoxes: 45,
    releasedBoxes: 8,
    palletsCount: 2,
    unitPrice: 249.00,
    warehouseId: 'w2',
  },
  {
    id: 'inv4',
    productName: 'Aluminum Laptop Stand',
    sku: 'ALS-SLV-ADJ',
    image: 'https://images.unsplash.com/photo-1554994610-7897470458df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBzdGFuZCUyMGFsdW1pbnVtfGVufDF8fHx8MTc2OTY4ODgyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    totalBoxes: 30,
    releasedBoxes: 22,
    palletsCount: 1,
    unitPrice: 45.00,
    warehouseId: 'w2',
  },
  {
    id: 'inv5',
    productName: '10000mAh Power Bank — Slate',
    sku: 'PB-10K-SLT',
    image: 'https://images.unsplash.com/photo-1758218096054-ef3c7b56582c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0YWJsZSUyMHBvd2VyJTIwYmFuayUyMHByb2R1Y3QlMjB3aGl0ZXxlbnwxfHx8fDE3NzA3Mzk5NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    totalBoxes: 60,
    releasedBoxes: 10,
    palletsCount: 3,
    unitPrice: 28.00,
    warehouseId: 'w1',
  },
  {
    id: 'inv6',
    productName: 'Compact BT Speaker — Black',
    sku: 'BTS-CMP-BLK',
    image: 'https://images.unsplash.com/photo-1641563786213-185d68345426?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGJsdWV0b290aCUyMHNwZWFrZXIlMjBtaW5pbWFsfGVufDF8fHx8MTc3MDczOTk2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    totalBoxes: 40,
    releasedBoxes: 5,
    palletsCount: 2,
    unitPrice: 65.00,
    warehouseId: 'w1',
  },
];

export const mockReleaseRequests: ReleaseRequest[] = [
  {
    id: 'req1',
    inventoryItemId: 'inv1',
    requesterName: 'Bilal Hussain',
    idCardNumber: '35201-1234567-9',
    vehicleNumber: 'LHR-2291',
    boxesRequested: 15,
    paymentAmount: 480.00,
    requestedDate: '2026-02-09',
    note: 'Buyer from Lahore, needs delivery before Friday',
  },
  {
    id: 'req2',
    inventoryItemId: 'inv3',
    requesterName: 'Ayesha Siddiqui',
    idCardNumber: '42201-9876543-1',
    vehicleNumber: 'ISB-8877',
    boxesRequested: 5,
    paymentAmount: 1245.00,
    requestedDate: '2026-02-09',
    note: 'Repeat buyer, third order this month',
  },
  {
    id: 'req3',
    inventoryItemId: 'inv2',
    requesterName: 'Kamran Malik',
    idCardNumber: '61101-5678901-3',
    vehicleNumber: 'KHI-4455',
    boxesRequested: 25,
    paymentAmount: 800.00,
    requestedDate: '2026-02-08',
  },
];

export const mockReleaseRecords: ReleaseRecord[] = [
  {
    id: 'rel1',
    inventoryItemId: 'inv1',
    recipientName: 'Ahmed Khan',
    idCardNumber: '35202-XXXX-123-4',
    vehicleNumber: 'LEA-7721',
    boxesReleased: 20,
    paymentAmount: 640.00,
    date: '2026-02-07',
    status: 'completed',
  },
  {
    id: 'rel2',
    inventoryItemId: 'inv1',
    recipientName: 'Sara Ali',
    idCardNumber: '42301-XXXX-456-7',
    vehicleNumber: 'ISB-3344',
    boxesReleased: 14,
    paymentAmount: 448.00,
    date: '2026-02-08',
    status: 'completed',
  },
  {
    id: 'rel3',
    inventoryItemId: 'inv3',
    recipientName: 'Omar Farooq',
    idCardNumber: '61101-XXXX-789-0',
    vehicleNumber: 'LHR-9988',
    boxesReleased: 8,
    paymentAmount: 1992.00,
    date: '2026-02-09',
    status: 'completed',
  },
];