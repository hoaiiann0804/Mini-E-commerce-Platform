import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { fetchProvinces, fetchDistricts, fetchWards } from "@/services/locationApi";
import type { Province, District, Ward } from "../../types/location.types";

interface LocationSelectorsProps {
  onLocationChange: (location: {
    country: string | null;
    state: string | null;
    city: string | null;
    countryCode?: string;
    stateCode?: string;
  }) => void;
  initialValues?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

const LocationSelectors: React.FC<LocationSelectorsProps> = ({
  onLocationChange,
  initialValues = {},
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Selected values (store codes for API calls, display names for UI)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");
  const [selectedWardCode, setSelectedWardCode] = useState<string>("");

  // Display names (for showing initial values)
  const [provinceName, setProvinceName] = useState<string>(initialValues.country || "");
  const [districtName, setDistrictName] = useState<string>(initialValues.state || "");
  const [wardName, setWardName] = useState<string>(initialValues.city || "");

  const [loading, setLoading] = useState({
    provinces: true,
    districts: false,
    wards: false,
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading((prev) => ({ ...prev, provinces: true }));
        const data = await fetchProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      } finally {
        setLoading((prev) => ({ ...prev, provinces: false }));
      }
    };

    loadProvinces();
  }, []);

  // Handle province change - load districts
  const handleProvinceChange = async (event: SelectChangeEvent) => {
    const provinceCode = event.target.value as string;
    const province = provinces.find((p) => p.code.toString() === provinceCode);

    setSelectedProvinceCode(provinceCode);
    setProvinceName(province?.name_with_type || provinceCode);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    setDistricts([]);
    setWards([]);

    // Notify parent
    onLocationChange({
      country: province?.name_with_type || null,
      state: null,
      city: null,
      countryCode: provinceCode,
    });

    // Load districts for selected province
    if (provinceCode) {
      try {
        setLoading((prev) => ({ ...prev, districts: true }));
        const districtData = await fetchDistricts(provinceCode);
        setDistricts(districtData);
      } catch (error) {
        console.error("Failed to load districts:", error);
      } finally {
        setLoading((prev) => ({ ...prev, districts: false }));
      }
    }
  };

  // Handle district change - load wards
  const handleDistrictChange = async (event: SelectChangeEvent) => {
    const districtCode = event.target.value as string;
    const district = districts.find((d) => d.code.toString() === districtCode);

    setSelectedDistrictCode(districtCode);
    setDistrictName(district?.name_with_type || districtCode);
    setSelectedWardCode("");
    setWards([]);

    // Notify parent
    onLocationChange({
      country: provinceName,
      state: district?.name_with_type || null,
      city: null,
      countryCode: selectedProvinceCode,
      stateCode: districtCode,
    });

    // Load wards for selected district
    if (districtCode) {
      try {
        setLoading((prev) => ({ ...prev, wards: true }));
        const wardData = await fetchWards(districtCode);
        setWards(wardData);
      } catch (error) {
        console.error("Failed to load wards:", error);
      } finally {
        setLoading((prev) => ({ ...prev, wards: false }));
      }
    }
  };

  // Handle ward change
  const handleWardChange = (event: SelectChangeEvent) => {
    const wardCode = event.target.value as string;
    const ward = wards.find((w) => w.code.toString() === wardCode);

    setSelectedWardCode(wardCode);
    setWardName(ward?.name_with_type || wardCode);

    // Notify parent
    onLocationChange({
      country: provinceName,
      state: districtName,
      city: ward?.name_with_type || null,
      countryCode: selectedProvinceCode,
      stateCode: selectedDistrictCode,
    });
  };

  // Show loading while provinces are being loaded
  if (loading.provinces && provinces.length === 0) {
    return (
      <Box display="flex" flexDirection="column" gap={2} width="100%">
        <FormControl fullWidth>
          <InputLabel id="province-label">Tỉnh/Thành phố</InputLabel>
          <Select
            labelId="province-label"
            label="Tỉnh/Thành phố"
            disabled
            value=""
          >
            <MenuItem disabled>Đang tải...</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth disabled>
          <InputLabel id="district-label">Quận/Huyện</InputLabel>
          <Select
            labelId="district-label"
            label="Quận/Huyện"
            disabled
            value=""
          />
        </FormControl>
        <FormControl fullWidth disabled>
          <InputLabel id="ward-label">Phường/Xã</InputLabel>
          <Select
            labelId="ward-label"
            label="Phường/Xã"
            disabled
            value=""
          />
        </FormControl>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={2} width="100%">
      {/* Province/Tinh Thanh Pho */}
      <FormControl fullWidth>
        <InputLabel id="province-label">Tỉnh/Thành phố</InputLabel>
        <Select
          labelId="province-label"
          value={selectedProvinceCode}
          label="Tỉnh/Thành phố"
          onChange={handleProvinceChange}
          disabled={loading.provinces}
        >
          {provinces.map((province) => (
            <MenuItem key={province.code} value={province.code.toString()}>
              {province.name_with_type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* District/Quan Huyen */}
      <FormControl fullWidth>
        <InputLabel id="district-label">Quận/Huyện</InputLabel>
        <Select
          labelId="district-label"
          value={selectedDistrictCode}
          label="Quận/Huyện"
          onChange={handleDistrictChange}
          disabled={!selectedProvinceCode || loading.districts}
        >
          {loading.districts ? (
            <MenuItem disabled>Đang tải...</MenuItem>
          ) : (
            districts.map((district) => (
              <MenuItem key={district.code} value={district.code.toString()}>
                {district.name_with_type}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Ward/Phuong Xa */}
      <FormControl fullWidth>
        <InputLabel id="ward-label">Phường/Xã</InputLabel>
        <Select
          labelId="ward-label"
          value={selectedWardCode}
          label="Phường/Xã"
          onChange={handleWardChange}
          disabled={!selectedDistrictCode || loading.wards}
        >
          {loading.wards ? (
            <MenuItem disabled>Đang tải...</MenuItem>
          ) : (
            wards.map((ward) => (
              <MenuItem key={ward.code} value={ward.code.toString()}>
                {ward.name_with_type}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LocationSelectors;

