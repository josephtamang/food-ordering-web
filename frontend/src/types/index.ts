export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "staff" | "customer";
  createdAt: string;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string } | string;
  product: string;
  order?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  image: string;
  isActive: boolean;
}

export interface BogoConfig {
  buyQuantity: number;
  getQuantity: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: Category | string;
  image: string;
  images: string[];
  rating: number;
  numReviews: number;
  isAvailable: boolean;
  isVeg: boolean;

  // Discount & Promotional Fields
  discountType?: 'none' | 'percentage' | 'fixed' | 'bogo' | 'combo';
  discountValue?: number;
  bogoConfig?: BogoConfig;
  comboItems?: string[];
  comboPrice?: number;

  // Promotional Flags
  isFeatured?: boolean;
  isHotDeal?: boolean;
  isDailySpecial?: boolean;
  isChefSpecial?: boolean;

  // Offer Details
  offerLabel?: string;
  offerValidUntil?: string;

  // Virtual fields
  finalPrice?: number;
  savingsAmount?: number;
  savingsPercentage?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  _id: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  _id: string;
  user: User | string;
  items: OrderItem[];
  tableNumber: string;
  status: "pending" | "confirmed" | "preparing" | "served" | "completed" | "cancelled";
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  isPaid: boolean;
  createdAt: string;
}

export interface Bill {
  _id: string;
  order: Order | string;
  user: User | string;
  billNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "esewa" | "khalti" | "bank";
  isPaid: boolean;
  paidAt?: string;
  status?: "requested" | "generated" | "paid";
  requestedBy?: "customer" | "staff" | "admin";
  callWaiter?: boolean;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  type: 'offer' | 'event' | 'notice' | 'closure' | 'update';
  isPinned: boolean;
  isActive: boolean;
  expiresAt?: string | null;
  createdBy: { _id: string; name: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
