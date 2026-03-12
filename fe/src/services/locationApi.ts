import axios from "axios";
import type { Province, District, Ward, ProvinceWithDistricts, DistrictWithWards } from "../types/location.types";

const API_BASE_URL = "https://provinces.open-api.vn/api";

/**
 * Vietnam Provinces Open API Service
 * API Documentation: https://provinces.open-api.vn
 * 
 * Endpoints:
 * - GET /p/ - Get all provinces
 * - GET /p/{provinceCode}?depth=2 - Get province with districts
 * - GET /d/{districtCode}?depth=2 - Get district with wards
 */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Fetch all provinces
 * GET /p/
 */
export const fetchProvinces = async (): Promise<Province[]> => {
  try {
    const response = await apiClient.get<Province[]>("/p/");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch provinces:", error);
    throw new Error("Không thể tải danh sách tỉnh/thành phố");
  }
};

/**
 * Fetch districts for a specific province
 * GET /p/{provinceCode}?depth=2
 * @param provinceCode - The province code (e.g., 01 for Hà Nội)
 */
export const fetchDistricts = async (provinceCode: number | string): Promise<District[]> => {
  try {
    const response = await apiClient.get<ProvinceWithDistricts>(`/p/${provinceCode}?depth=2`);
    return response.data.districts || [];
  } catch (error) {
    console.error("Failed to fetch districts:", error);
    throw new Error("Không thể tải danh sách quận/huyện");
  }
};

/**
 * Fetch wards for a specific district
 * GET /d/{districtCode}?depth=2
 * @param districtCode - The district code (e.g., 001 for Quận Ba Đình)
 */
export const fetchWards = async (districtCode: number | string): Promise<Ward[]> => {
  try {
    const response = await apiClient.get<DistrictWithWards>(`/d/${districtCode}?depth=2`);
    return response.data.wards || [];
  } catch (error) {
    console.error("Failed to fetch wards:", error);
    throw new Error("Không thể tải danh sách phường/xã");
  }
};

/**
 * Get province by code
 * @param provinceCode - The province code
 */
export const getProvinceByCode = async (provinceCode: number | string): Promise<Province | null> => {
  try {
    const response = await apiClient.get<Province>(`/p/${provinceCode}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch province:", error);
    return null;
  }
};

/**
 * Get district by code
 * @param districtCode - The district code
 */
export const getDistrictByCode = async (districtCode: number | string): Promise<District | null> => {
  try {
    const response = await apiClient.get<District>(`/d/${districtCode}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch district:", error);
    return null;
  }
};

/**
 * Get ward by code
 * @param wardCode - The ward code
 */
export const getWardByCode = async (wardCode: number | string): Promise<Ward | null> => {
  try {
    const response = await apiClient.get<Ward>(`/w/${wardCode}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch ward:", error);
    return null;
  }
};

export default {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
  getProvinceByCode,
  getDistrictByCode,
  getWardByCode,
};

