export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  display_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  prep_time: number;
  rating: number;
  is_veg: boolean;
  is_eggless: boolean;
  is_available: boolean;
  display_order: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  selection_type: 'single' | 'multi';
  is_required: boolean;
  display_order: number;
}

export interface CustomizationOption {
  id: string;
  group_id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

export interface DeliveryZone {
  id: string;
  pincode: string;
  area_name: string;
  delivery_fee: number;
  min_order: number;
  estimated_time: number;
  is_active: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface SelectedCustomization {
  group_name: string;
  option_name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menu_item: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  total_price: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'expired';

export type OrderType = 'delivery' | 'pickup';
export type PaymentMethod = 'upi' | 'card' | 'cod';

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  pincode: string;
  order_type: OrderType;
  delivery_fee: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: string;
  status: OrderStatus;
  placed_at: string;
  confirmed_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  queue_position: number | null;
  expires_at: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  customizations: SelectedCustomization[];
}
