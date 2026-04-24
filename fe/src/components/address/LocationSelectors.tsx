import React from "react";
import { Box, TextField } from "@mui/material";

export type LocationValue = {
  country: string;
  province: string; // Tỉnh/Thành phố
  ward: string; // Phường/Xã
};

type LegacyInitialValues = {
  country?: string;
  state?: string;
  city?: string;
};

type LocationSelectorsProps =
  | {
      value?: LocationValue;
      onChange: (value: LocationValue) => void;
      initialValues?: never;
      onLocationChange?: never;
    }
  | {
      initialValues?: LegacyInitialValues;
      onLocationChange: (value: LocationValue) => void;
      value?: never;
      onChange?: never;
    };

const LocationSelectors: React.FC<LocationSelectorsProps> = ({
  value,
  onChange,
  initialValues,
  onLocationChange,
}) => {
  const [internalValue, setInternalValue] = React.useState<LocationValue>(() => ({
    country: initialValues?.country ?? "Vietnam",
    province: initialValues?.state ?? "",
    ward: initialValues?.city ?? "",
  }));

  const safeValue: LocationValue =
    value ??
    internalValue ?? {
      country: "Vietnam",
      province: "",
      ward: "",
    };

  const emitChange = (next: LocationValue) => {
    if (onChange) return onChange(next);
    setInternalValue(next);
    onLocationChange?.(next);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Tỉnh / Thành phố"
        value={safeValue.province}
        onChange={(e) => emitChange({ ...safeValue, province: e.target.value })}
      />

      <TextField
        label="Phường / Xã"
        value={safeValue.ward}
        onChange={(e) => emitChange({ ...safeValue, ward: e.target.value })}
      />

      <TextField
        label="Quốc gia"
        value={safeValue.country}
        onChange={(e) => emitChange({ ...safeValue, country: e.target.value })}
      />
    </Box>
  );
};

export default LocationSelectors;
