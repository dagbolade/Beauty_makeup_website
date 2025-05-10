export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export interface Service {
  id: number;
  name: string;
  duration: string;
  price: number;
  description: string;
  image: string;
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  service_type_id: string;
  service_option: string;
  booking_date: string;
  time_slot_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
}