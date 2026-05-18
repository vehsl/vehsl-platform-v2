
export interface OrderItem {
  id: string;
  name: string;
  specs: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Seller {
  name: string;
  rating: number;
  location: string;
  contactEmail: string;
}

export interface TrackingStep {
  label: string;
  date: string;
  completed: boolean;
  current?: boolean;
}

export interface ContainerInfo {
  containerId: string;
  type: '20ft' | '40ft' | '40ft HC' | 'LCL';
  sealNumber: string;
  weight: string;
  status: 'loaded' | 'in-transit' | 'at-port' | 'customs' | 'delivered';
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'Arriving' | 'Delivered' | 'Cancelled' | 'Processing' | 'In Transit' | 'Customs' | 'At Warehouse';
  date: string;
  arrivalDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    company?: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
    phone: string;
  };
  paymentMethod: {
    type: 'Visa' | 'MasterCard' | 'PayPal' | 'Wire Transfer';
    last4: string;
    expiry?: string;
  };
  seller: Seller;
  // B2B extensions
  shipmentType?: 'FCL' | 'LCL' | 'Air' | 'Express';
  containers?: ContainerInfo[];
  trackingSteps?: TrackingStep[];
  buyerCompany?: string;
  poNumber?: string;
  totalWeight?: string;
  containerCount?: number;
}

// Helper to create dates relative to now
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString();
const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '4KNW280R',
    status: 'Arriving',
    date: oneHourAgo,
    arrivalDate: '2026-02-23',
    shipmentType: 'FCL',
    buyerCompany: 'Acme Corporation',
    poNumber: 'PO-2026-0847',
    totalWeight: '2,400 kg',
    containerCount: 2,
    containers: [
      { containerId: 'MSKU-2847561', type: '40ft', sealNumber: 'SL-88421', weight: '1,600 kg', status: 'in-transit' },
      { containerId: 'MSKU-2847562', type: '20ft', sealNumber: 'SL-88422', weight: '800 kg', status: 'in-transit' },
    ],
    trackingSteps: [
      { label: 'Order confirmed', date: 'Feb 14', completed: true },
      { label: 'Production complete', date: 'Feb 16', completed: true },
      { label: 'Quality inspection', date: 'Feb 17', completed: true },
      { label: 'Loaded at port', date: 'Feb 18', completed: true },
      { label: 'In transit', date: 'Feb 19', completed: false, current: true },
      { label: 'Customs clearance', date: 'Est. Feb 22', completed: false },
      { label: 'Delivered', date: 'Est. Feb 23', completed: false },
    ],
    items: [
      {
        id: 'i1',
        name: 'Alex USB C wire',
        specs: 'Green, 2 meters, 40 Gbps',
        quantity: 500,
        price: 3.20,
        image: 'https://images.unsplash.com/photo-1639675960002-2f414c58ed79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2IlMjBjJTIwY2FibGUlMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzY5Njg4ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 'i2',
        name: 'Alex USB C wire',
        specs: 'White, 1 meter, 80 Gbps',
        quantity: 800,
        price: 3.20,
        image: 'https://images.unsplash.com/photo-1639675960002-2f414c58ed79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2IlMjBjJTIwY2FibGUlMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzY5Njg4ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 4160.00,
    shipping: 680.00,
    tax: 420.00,
    total: 5260.00,
    shippingAddress: {
      name: 'Noah Mateo',
      company: 'Acme Corporation',
      street: '123 Business Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
      email: 'abc@gmail.com',
      phone: '+1746290398'
    },
    paymentMethod: {
      type: 'Wire Transfer',
      last4: '3425',
      expiry: '01/26'
    },
    seller: {
      name: 'TechGadgets Inc.',
      rating: 4.8,
      location: 'Shenzhen, China',
      contactEmail: 'support@techgadgets.com'
    }
  },
  {
    id: '2',
    orderNumber: '9JKS992L',
    status: 'Processing',
    date: threeHoursAgo,
    arrivalDate: '2026-03-05',
    shipmentType: 'LCL',
    buyerCompany: 'Acme Corporation',
    poNumber: 'PO-2026-0852',
    totalWeight: '340 kg',
    containerCount: 0,
    trackingSteps: [
      { label: 'Order confirmed', date: 'Feb 19', completed: true },
      { label: 'In production', date: 'Feb 19', completed: false, current: true },
      { label: 'Quality check', date: 'Est. Feb 25', completed: false },
      { label: 'Shipped', date: 'Est. Feb 28', completed: false },
      { label: 'Delivered', date: 'Est. Mar 5', completed: false },
    ],
    items: [
      {
        id: 'i3',
        name: 'Wireless Noise Cancelling Headphones',
        specs: 'Black, Over-ear, ANC v3',
        quantity: 120,
        price: 24.90,
        image: 'https://images.unsplash.com/photo-1624564039739-035817ba4098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3Njk2ODg4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 2988.00,
    shipping: 320.00,
    tax: 265.00,
    total: 3573.00,
    shippingAddress: {
      name: 'Noah Mateo',
      company: 'Acme Corporation',
      street: '123 Business Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
      email: 'abc@gmail.com',
      phone: '+1746290398'
    },
    paymentMethod: {
      type: 'Visa',
      last4: '3425'
    },
    seller: {
      name: 'AudioPro World',
      rating: 4.9,
      location: 'Austin, TX',
      contactEmail: 'help@audiopro.com'
    }
  },
  {
    id: '3',
    orderNumber: '2MMP101X',
    status: 'Delivered',
    date: oneMonthAgo,
    arrivalDate: '2026-01-25',
    shipmentType: 'FCL',
    buyerCompany: 'Acme Corporation',
    poNumber: 'PO-2026-0791',
    totalWeight: '3,100 kg',
    containerCount: 3,
    containers: [
      { containerId: 'CMAU-1194723', type: '40ft HC', sealNumber: 'SL-77103', weight: '1,200 kg', status: 'delivered' },
      { containerId: 'CMAU-1194724', type: '40ft', sealNumber: 'SL-77104', weight: '1,100 kg', status: 'delivered' },
      { containerId: 'CMAU-1194725', type: '20ft', sealNumber: 'SL-77105', weight: '800 kg', status: 'delivered' },
    ],
    trackingSteps: [
      { label: 'Order confirmed', date: 'Dec 28', completed: true },
      { label: 'Production complete', date: 'Jan 8', completed: true },
      { label: 'Quality inspection', date: 'Jan 10', completed: true },
      { label: 'Loaded at port', date: 'Jan 12', completed: true },
      { label: 'In transit', date: 'Jan 13', completed: true },
      { label: 'Customs clearance', date: 'Jan 22', completed: true },
      { label: 'Delivered', date: 'Jan 25', completed: true },
    ],
    items: [
      {
        id: 'i4',
        name: 'Aluminum Laptop Stand',
        specs: 'Silver, Adjustable, Bulk',
        quantity: 600,
        price: 8.50,
        image: 'https://images.unsplash.com/photo-1554994610-7897470458df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBzdGFuZCUyMGFsdW1pbnVtfGVufDF8fHx8MTc2OTY4ODgyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 'i5',
        name: 'Custom Mechanical Keyboard',
        specs: '65% layout, Brown switches',
        quantity: 200,
        price: 18.00,
        image: 'https://images.unsplash.com/photo-1656711132603-ebac427ee014?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pY2FsJTIwa2V5Ym9hcmQlMjBjdXN0b218ZW58MXx8fHwxNzY5Njg4NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 8700.00,
    shipping: 1250.00,
    tax: 870.00,
    total: 10820.00,
    shippingAddress: {
      name: 'Noah Mateo',
      company: 'Acme Corporation',
      street: '123 Business Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
      email: 'abc@gmail.com',
      phone: '+1746290398'
    },
    paymentMethod: {
      type: 'MasterCard',
      last4: '8812'
    },
    seller: {
      name: 'ErgoLife',
      rating: 4.6,
      location: 'Seattle, WA',
      contactEmail: 'contact@ergolife.com'
    }
  },
  {
    id: '4',
    orderNumber: '7PLQ443K',
    status: 'In Transit',
    date: fiveDaysAgo,
    arrivalDate: '2026-02-25',
    shipmentType: 'FCL',
    buyerCompany: 'Meridian Retail Group',
    poNumber: 'PO-2026-0839',
    totalWeight: '4,800 kg',
    containerCount: 2,
    containers: [
      { containerId: 'HLXU-9028431', type: '40ft HC', sealNumber: 'SL-90234', weight: '2,800 kg', status: 'in-transit' },
      { containerId: 'HLXU-9028432', type: '40ft', sealNumber: 'SL-90235', weight: '2,000 kg', status: 'at-port' },
    ],
    trackingSteps: [
      { label: 'Order confirmed', date: 'Feb 10', completed: true },
      { label: 'Production complete', date: 'Feb 13', completed: true },
      { label: 'Quality inspection', date: 'Feb 14', completed: true },
      { label: 'Loaded at port', date: 'Feb 15', completed: true },
      { label: 'In transit', date: 'Feb 16', completed: false, current: true },
      { label: 'Customs clearance', date: 'Est. Feb 23', completed: false },
      { label: 'Delivered', date: 'Est. Feb 25', completed: false },
    ],
    items: [
      {
        id: 'i6',
        name: 'Industrial Power Supply 500W',
        specs: '110-240V, Modular, Gold-rated',
        quantity: 300,
        price: 18.50,
        image: 'https://images.unsplash.com/photo-1570086625762-7c1396540ac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwcG93ZXIlMjBzdXBwbHklMjB1bml0JTIwcHJvZHVjdHxlbnwxfHx8fDE3NzE0OTUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 'i7',
        name: 'LED Panel Light 60x60cm',
        specs: '40W, 4000K Neutral White',
        quantity: 1200,
        price: 4.20,
        image: 'https://images.unsplash.com/photo-1584092352562-6d24e5635f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMRUQlMjBwYW5lbCUyMGxpZ2h0cyUyMHByb2R1Y3QlMjB3aGl0ZXxlbnwxfHx8fDE3NzE0OTUzMzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 10590.00,
    shipping: 1450.00,
    tax: 960.00,
    total: 13000.00,
    shippingAddress: {
      name: 'Sarah Chen',
      company: 'Meridian Retail Group',
      street: '8200 Commerce Blvd, Suite 400',
      city: 'Houston',
      state: 'TX',
      zip: '77036',
      country: 'United States',
      email: 'sarah@meridianretail.com',
      phone: '+1832509234'
    },
    paymentMethod: {
      type: 'Wire Transfer',
      last4: '7701'
    },
    seller: {
      name: 'Shenzhen Bright Co.',
      rating: 4.7,
      location: 'Shenzhen, China',
      contactEmail: 'export@shenzhen-bright.cn'
    }
  },
  {
    id: '5',
    orderNumber: '3RBX771M',
    status: 'Customs',
    date: oneWeekAgo,
    arrivalDate: '2026-02-20',
    shipmentType: 'LCL',
    buyerCompany: 'NexGen Electronics',
    poNumber: 'PO-2026-0822',
    totalWeight: '560 kg',
    containerCount: 0,
    trackingSteps: [
      { label: 'Order confirmed', date: 'Feb 5', completed: true },
      { label: 'Production complete', date: 'Feb 8', completed: true },
      { label: 'Shipped', date: 'Feb 10', completed: true },
      { label: 'In transit', date: 'Feb 11', completed: true },
      { label: 'Customs clearance', date: 'Feb 17', completed: false, current: true },
      { label: 'Delivered', date: 'Est. Feb 20', completed: false },
    ],
    items: [
      {
        id: 'i8',
        name: 'Cat6 Ethernet Cable 50m',
        specs: 'Shielded, Blue, Bulk Roll',
        quantity: 400,
        price: 2.80,
        image: 'https://images.unsplash.com/photo-1605192020788-24d8eae86e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldGhlcm5ldCUyMGNhYmxlJTIwbmV0d29ya2luZyUyMHByb2R1Y3R8ZW58MXx8fHwxNzcxNDk1MzMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 1120.00,
    shipping: 190.00,
    tax: 105.00,
    total: 1415.00,
    shippingAddress: {
      name: 'James Walker',
      company: 'NexGen Electronics',
      street: '1200 Tech Drive',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'United States',
      email: 'james@nexgen.io',
      phone: '+1512889001'
    },
    paymentMethod: {
      type: 'Visa',
      last4: '5590'
    },
    seller: {
      name: 'CableTech Direct',
      rating: 4.5,
      location: 'Taipei, Taiwan',
      contactEmail: 'orders@cabletech.tw'
    }
  },
  {
    id: '6',
    orderNumber: '8WMN554Q',
    status: 'Delivered',
    date: twoWeeksAgo,
    arrivalDate: '2026-02-10',
    shipmentType: 'Air',
    buyerCompany: 'Acme Corporation',
    poNumber: 'PO-2026-0810',
    totalWeight: '120 kg',
    containerCount: 0,
    trackingSteps: [
      { label: 'Order confirmed', date: 'Jan 28', completed: true },
      { label: 'Production complete', date: 'Feb 2', completed: true },
      { label: 'Air freight dispatched', date: 'Feb 4', completed: true },
      { label: 'Arrived at hub', date: 'Feb 7', completed: true },
      { label: 'Customs clearance', date: 'Feb 8', completed: true },
      { label: 'Delivered', date: 'Feb 10', completed: true },
    ],
    items: [
      {
        id: 'i9',
        name: 'Dual-Band WiFi Router',
        specs: 'AX6000, White, Enterprise',
        quantity: 50,
        price: 42.00,
        image: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMHJvdXRlciUyMHByb2R1Y3QlMjBtaW5pbWFsfGVufDF8fHx8MTc3MTQ5NTMzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 2100.00,
    shipping: 480.00,
    tax: 210.00,
    total: 2790.00,
    shippingAddress: {
      name: 'Noah Mateo',
      company: 'Acme Corporation',
      street: '123 Business Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
      email: 'abc@gmail.com',
      phone: '+1746290398'
    },
    paymentMethod: {
      type: 'Visa',
      last4: '3425'
    },
    seller: {
      name: 'NetWave Systems',
      rating: 4.8,
      location: 'Dongguan, China',
      contactEmail: 'sales@netwave.com'
    }
  },
  {
    id: '7',
    orderNumber: '1FTR889P',
    status: 'Delivered',
    date: threeWeeksAgo,
    arrivalDate: '2026-02-01',
    shipmentType: 'FCL',
    buyerCompany: 'Meridian Retail Group',
    poNumber: 'PO-2026-0795',
    totalWeight: '6,200 kg',
    containerCount: 4,
    containers: [
      { containerId: 'OOCL-3301295', type: '40ft HC', sealNumber: 'SL-65001', weight: '1,800 kg', status: 'delivered' },
      { containerId: 'OOCL-3301296', type: '40ft HC', sealNumber: 'SL-65002', weight: '1,700 kg', status: 'delivered' },
      { containerId: 'OOCL-3301297', type: '40ft', sealNumber: 'SL-65003', weight: '1,500 kg', status: 'delivered' },
      { containerId: 'OOCL-3301298', type: '20ft', sealNumber: 'SL-65004', weight: '1,200 kg', status: 'delivered' },
    ],
    trackingSteps: [
      { label: 'Order confirmed', date: 'Jan 5', completed: true },
      { label: 'Production complete', date: 'Jan 15', completed: true },
      { label: 'Quality inspection', date: 'Jan 17', completed: true },
      { label: 'Loaded at port', date: 'Jan 20', completed: true },
      { label: 'In transit', date: 'Jan 21', completed: true },
      { label: 'Customs clearance', date: 'Jan 30', completed: true },
      { label: 'Delivered', date: 'Feb 1', completed: true },
    ],
    items: [
      {
        id: 'i10',
        name: 'Smart Watch Pro X2',
        specs: 'Titanium, GPS, 50mm',
        quantity: 2000,
        price: 12.00,
        image: 'https://images.unsplash.com/photo-1673997303871-178507ca875a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMHdhdGNoJTIwcHJvZHVjdCUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzE0MjQyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 'i11',
        name: 'Alex USB C wire',
        specs: 'Black, 1.5m, 40 Gbps',
        quantity: 3000,
        price: 2.80,
        image: 'https://images.unsplash.com/photo-1639675960002-2f414c58ed79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2IlMjBjJTIwY2FibGUlMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzY5Njg4ODIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 32400.00,
    shipping: 2800.00,
    tax: 2900.00,
    total: 38100.00,
    shippingAddress: {
      name: 'Sarah Chen',
      company: 'Meridian Retail Group',
      street: '8200 Commerce Blvd, Suite 400',
      city: 'Houston',
      state: 'TX',
      zip: '77036',
      country: 'United States',
      email: 'sarah@meridianretail.com',
      phone: '+1832509234'
    },
    paymentMethod: {
      type: 'Wire Transfer',
      last4: '7701'
    },
    seller: {
      name: 'TechGadgets Inc.',
      rating: 4.8,
      location: 'Shenzhen, China',
      contactEmail: 'support@techgadgets.com'
    }
  },
  {
    id: '8',
    orderNumber: '5KXT220J',
    status: 'Cancelled',
    date: sixWeeksAgo,
    arrivalDate: '2026-01-28',
    shipmentType: 'LCL',
    buyerCompany: 'Summit Trade LLC',
    poNumber: 'PO-2026-0768',
    totalWeight: '280 kg',
    containerCount: 0,
    items: [
      {
        id: 'i12',
        name: 'Wireless Noise Cancelling Headphones',
        specs: 'White, Over-ear, ANC v2',
        quantity: 250,
        price: 22.00,
        image: 'https://images.unsplash.com/photo-1624564039739-035817ba4098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3Njk2ODg4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 5500.00,
    shipping: 340.00,
    tax: 468.00,
    total: 6308.00,
    shippingAddress: {
      name: 'Marcus Dean',
      company: 'Summit Trade LLC',
      street: '400 Pacific Heights',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'United States',
      email: 'marcus@summittrade.co',
      phone: '+1503772819'
    },
    paymentMethod: {
      type: 'PayPal',
      last4: '4402'
    },
    seller: {
      name: 'AudioPro World',
      rating: 4.9,
      location: 'Austin, TX',
      contactEmail: 'help@audiopro.com'
    }
  },
  {
    id: '9',
    orderNumber: '6NPQ339W',
    status: 'Delivered',
    date: twoMonthsAgo,
    arrivalDate: '2025-12-28',
    shipmentType: 'FCL',
    buyerCompany: 'Acme Corporation',
    poNumber: 'PO-2025-0712',
    totalWeight: '5,400 kg',
    containerCount: 3,
    containers: [
      { containerId: 'MSKU-7718423', type: '40ft HC', sealNumber: 'SL-55901', weight: '2,100 kg', status: 'delivered' },
      { containerId: 'MSKU-7718424', type: '40ft', sealNumber: 'SL-55902', weight: '1,800 kg', status: 'delivered' },
      { containerId: 'MSKU-7718425', type: '20ft', sealNumber: 'SL-55903', weight: '1,500 kg', status: 'delivered' },
    ],
    items: [
      {
        id: 'i13',
        name: '10000mAh Power Bank',
        specs: 'Slate, USB-C PD, Bulk',
        quantity: 1500,
        price: 5.60,
        image: 'https://images.unsplash.com/photo-1758218096054-ef3c7b56582c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0YWJsZSUyMHBvd2VyJTIwYmFuayUyMHByb2R1Y3QlMjB3aGl0ZXxlbnwxfHx8fDE3NzA3Mzk5NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 'i14',
        name: 'Compact BT Speaker',
        specs: 'Black, IPX7, 20W',
        quantity: 800,
        price: 8.20,
        image: 'https://images.unsplash.com/photo-1641563786213-185d68345426?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGJsdWV0b290aCUyMHNwZWFrZXIlMjBtaW5pbWFsfGVufDF8fHx8MTc3MDczOTk2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 14960.00,
    shipping: 1800.00,
    tax: 1340.00,
    total: 18100.00,
    shippingAddress: {
      name: 'Noah Mateo',
      company: 'Acme Corporation',
      street: '123 Business Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States',
      email: 'abc@gmail.com',
      phone: '+1746290398'
    },
    paymentMethod: {
      type: 'Wire Transfer',
      last4: '3425'
    },
    seller: {
      name: 'TechGadgets Inc.',
      rating: 4.8,
      location: 'Shenzhen, China',
      contactEmail: 'support@techgadgets.com'
    }
  },
  {
    id: '10',
    orderNumber: '4VBN882S',
    status: 'At Warehouse',
    date: twoDaysAgo,
    arrivalDate: '2026-02-17',
    shipmentType: 'Express',
    buyerCompany: 'NexGen Electronics',
    poNumber: 'PO-2026-0848',
    totalWeight: '85 kg',
    containerCount: 0,
    trackingSteps: [
      { label: 'Order confirmed', date: 'Feb 14', completed: true },
      { label: 'Dispatched', date: 'Feb 15', completed: true },
      { label: 'In transit', date: 'Feb 15', completed: true },
      { label: 'Arrived at warehouse', date: 'Feb 17', completed: true },
      { label: 'Ready for pickup', date: 'Feb 17', completed: false, current: true },
    ],
    items: [
      {
        id: 'i15',
        name: 'Custom Mechanical Keyboard',
        specs: 'TKL, Cherry MX Red, White',
        quantity: 75,
        price: 22.00,
        image: 'https://images.unsplash.com/photo-1656711132603-ebac427ee014?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pY2FsJTIwa2V5Ym9hcmQlMjBjdXN0b218ZW58MXx8fHwxNzY5Njg4NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ],
    subtotal: 1650.00,
    shipping: 240.00,
    tax: 151.00,
    total: 2041.00,
    shippingAddress: {
      name: 'James Walker',
      company: 'NexGen Electronics',
      street: '1200 Tech Drive',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'United States',
      email: 'james@nexgen.io',
      phone: '+1512889001'
    },
    paymentMethod: {
      type: 'MasterCard',
      last4: '2210'
    },
    seller: {
      name: 'ErgoLife',
      rating: 4.6,
      location: 'Seattle, WA',
      contactEmail: 'contact@ergolife.com'
    }
  },
];
