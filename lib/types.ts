export type OrderStatus = 'primljeno' | 'u_izradi' | 'gotovo' | 'poslato';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  primljeno: 'Primljeno',
  u_izradi: 'U Izradi',
  gotovo: 'Gotovo',
  poslato: 'Poslato',
};

export const STATUS_FLOW: OrderStatus[] = ['primljeno', 'u_izradi', 'gotovo', 'poslato'];

export interface OrderWallet {
  id?: string;
  order_id?: string;
  category: string;
  model: string;
  quantity: number;
}

export interface OrderImage {
  id?: string;
  order_id?: string;
  image_url: string;
  local_uri?: string;
}

export interface Order {
  id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address: string;
  status: OrderStatus;
  notes?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  order_wallets?: OrderWallet[];
  order_images?: OrderImage[];
}
