export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  isActive: boolean;
  sortOrder?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandsResponse {
  brands: Brand[];
  total: number;
}

export interface BrandsFilters {
  id?: string;
  isActive?: boolean;
  search?: string;
}
