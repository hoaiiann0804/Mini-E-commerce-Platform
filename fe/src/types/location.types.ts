/**
 * Vietnam Provinces Open API Types
 * API Documentation: https://provinces.open-api.vn
 */

// Province (Tỉnh/Thành phố)
export interface Province {
  code: number;
  name: string;
  slug: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code_name: string | null;
  province_code: string | null;
  administrative_unit_id: number | null;
  administrative_region_id: number | null;
}

// District (Quận/Huyện)
export interface District {
  code: number;
  name: string;
  slug: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code_name: string | null;
  province_code: string | null;
  administrative_unit_id: number | null;
}

// Ward (Phường/Xã)
export interface Ward {
  code: number;
  name: string;
  slug: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code_name: string | null;
  district_code: string | null;
  administrative_unit_id: number | null;
}

// Province with districts (depth=2 response)
export interface ProvinceWithDistricts extends Province {
  districts: District[];
}

// District with wards (depth=2 response)
export interface DistrictWithWards extends District {
  wards: Ward[];
}

// Location change callback type
export interface LocationChangeEvent {
  country: string | null;      // Province name
  state: string | null;        // District name  
  city: string | null;         // Ward name
  countryCode?: string;        // Province code
  stateCode?: string;          // District code
}

// Initial values for LocationSelectors
export interface LocationInitialValues {
  country?: string;
  state?: string;
  city?: string;
}

