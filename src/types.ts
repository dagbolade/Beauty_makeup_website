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
  slot_date: string;
  is_available: boolean;
  created_at?: string;
}

// Enquiry interface (uses the existing bookings table)
export interface Enquiry {
  id: string;
  service_type_id: string;
  service_option: string;
  booking_date: string;
  time_slot_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes?: string;
  admin_notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at?: string;
  updated_at?: string;
  timeSlot?: TimeSlot; // For joined queries
}

export interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  created_at?: string;
}

export interface GalleryImage {
  name: string;
  url: string;
  size?: number;
  createdAt?: string;
  category?: string;
}