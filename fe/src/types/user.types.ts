// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Full name (firstName + lastName)
  phone?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'manager';
  addresses?: Address[];
  defaultAddressId?: string;
  wishlist?: string[]; // Array of product IDs
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id?: string;
  name?: string; // Label for the address (e.g., "Home", "Work")
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  // Legacy fields (some backends store province/ward instead)
  city?: string | null;
  state?: string | null;
  // Preferred fields (used by current backend)
  province?: string | null;
  ward?: string | null;
  provinceCode?: string | null;
  wardCode?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
  addressType?: "home" | "office" | "other";
  countryCode?: string;
  stateCode?: string;
}
