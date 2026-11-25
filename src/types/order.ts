/**
 * Kontrak tipe untuk Cart Reservation, Order Management System (OMS),
 * dan Tiket Servis Konter Fajar Cell.
 */

export type CartReservationStatus =
  | "held"
  | "converted"
  | "released"
  | "expired";

export type OrderStatus =
  | "pending_approval"
  | "payment_review"
  | "approved"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

export type DeliveryMethod = "cod" | "pickup";

export type PaymentMethod = "qris" | "dana" | "cod";

export type OrderChangedBy = "customer" | "admin" | "system";

export type ServiceTicketStatus =
  | "received"
  | "diagnosing"
  | "waiting_parts"
  | "repairing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

export interface CartReservation {
  id: string;
  sessionId: string;
  productId: string;
  quantity: number;
  status: CartReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  reservationId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  thumbnail: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  warrantyDays: number;
  expiresAt: string;
}

export interface ProductAvailability {
  productId: string;
  totalStock: number;
  reservedByOthers: number;
  reservedBySelf: number;
  pendingOrderQty: number;
  availableStock: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  warrantyDays: number;
  createdAt: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: OrderChangedBy;
  note: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  sessionId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentUniqueCode: number;
  paymentProofUrl: string | null;
  destinationAddress: string;
  destinationLat: number | null;
  destinationLng: number | null;
  distanceKm: number;
  shippingFee: number;
  subtotal: number;
  totalAmount: number;
  notes: string;
  status: OrderStatus;
  stockDeducted: boolean;
  adminNotes: string;
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  history?: OrderStatusHistoryEntry[];
}

export interface CreateOrderInput {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentUniqueCode?: number;
  paymentProofUrl?: string | null;
  destinationAddress?: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  distanceKm?: number;
  shippingFee?: number;
  notes?: string;
}

export interface ReserveCartResult {
  ok: boolean;
  code?: string;
  message?: string;
  released?: boolean;
  reservationId?: string;
  productId: string;
  quantity?: number;
  expiresAt?: string;
  availableStock?: number;
}

export interface CreateOrderResult {
  ok: boolean;
  code?: string;
  message?: string;
  productId?: string;
  orderId?: string;
  orderCode?: string;
  status?: OrderStatus;
  subtotal?: number;
  shippingFee?: number;
  paymentUniqueCode?: number;
  totalAmount?: number;
}

export interface AdminOrderTransitionResult {
  ok: boolean;
  code?: string;
  message?: string;
  unchanged?: boolean;
  orderId?: string;
  orderCode?: string;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  stockDeducted?: boolean;
}

export interface ServiceTicket {
  id: string;
  ticketCode: string;
  brand: string;
  deviceModel: string;
  issues: string[];
  customerName: string;
  customerPhone: string;
  visitType: "datang-langsung" | "tanya-stok-dulu";
  estimatedCostMin: number;
  estimatedCostMax: number;
  notes: string;
  adminNotes: string;
  status: ServiceTicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceTicketInput {
  brand: string;
  deviceModel: string;
  issues: string[];
  customerName: string;
  customerPhone: string;
  visitType: "datang-langsung" | "tanya-stok-dulu";
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  notes?: string;
}
