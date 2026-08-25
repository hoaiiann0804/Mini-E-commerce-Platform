import React, { useState, useCallback, useMemo, Suspense } from "react";
import {
  Typography,
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Grid,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { Edit, Delete, Check, Map, EyeOff } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const LocationSelectors = React.lazy(
  () => import("@/components/address/LocationSelectors")
);
const AddressMapPicker = React.lazy(
  () => import("@/components/address/AddressMapPicker")
);
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  type Address,
} from "@/services/userApi";
import { formatAddressForDisplay } from "@/utils/addressFormatter";
import type { LocationValue } from "@/components/address/LocationSelectors";

// 🔹 Validation Schema
const useAddressSchema = () =>
  useMemo(
    () =>
      yup.object().shape({
        firstName: yup.string().required("Vui lòng nhập tên"),
        lastName: yup.string().required("Vui lòng nhập họ"),
        phone: yup.string().required("Vui lòng nhập số điện thoại"),
        address1: yup.string().required("Vui lòng nhập địa chỉ"),
        address2: yup.string().optional(),
        province: yup.string().required("Vui lòng chọn tỉnh/thành phố"),
        ward: yup.string().required("Vui lòng chọn phường/xã"),
        country: yup.string().required(),
        zip: yup.string().required(),
        isDefault: yup.boolean().default(false),
        addressType: yup
          .string()
          .oneOf(["home", "office", "other"])
          .default("home"),
      }),
    []
  );

interface LocationValues {
  country: string | null;
  state: string | null;
  city: string | null;
  countryCode?: string;
  stateCode?: string;
}

const AddressPage = () => {
  const schema = useAddressSchema();

  // API hooks
  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    refetch,
  } = useGetAddressesQuery();
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address1: "",
      address2: "",
      province: "",
      ward: "",
      country: "Vietnam",
      zip: "",
      addressType: "home",
      isDefault: false,
    },
  });

  const handleLocationChange = useCallback((newLoc: LocationValue) => {
    setValue("province", newLoc.province || "", { shouldValidate: true });
    setValue("ward", newLoc.ward || "", { shouldValidate: true });
    setValue("country", newLoc.country || "", { shouldValidate: true });
  }, [setValue]);

  // const handleLocationSelect = useCallback(
  //   (lat: number, lng: number, address: string) => {
  //     setMapPosition({ lat, lng });
  //     setValue("address1", address, { shouldValidate: true });

  //     // Also update the location fields if we can extract them from the address
  //     const addressParts = address.split(",").map((part) => part.trim());
  //     if (addressParts.length >= 3) {
  //       const city = addressParts[addressParts.length - 2];
  //       const paresd = normalizeAddress(data)
  //       setValue("city", city, { shouldValidate: true });
  //       setValue("country", country, { shouldValidate: true });

  //       // Update location state
  //       setLocation((prev) => ({
  //         ...prev,
  //         city,
  //         country,
  //       }));
  //     }
  //   },
  //   [setValue, setLocation]
  // );
  const handleLocationSelect = (
    lat: number,
    lng: number,
    address: string,
    normalized?: { province?: string; ward?: string; country?: string; zip?: string }
  ) => {
    setMapPosition({ lat, lng });
    setValue("address1", address, { shouldValidate: true });

    if (!normalized) return;

    setValue("province", normalized.province || "", { shouldValidate: true });
    setValue("ward", normalized.ward || "", { shouldValidate: true });
    setValue("country", normalized.country || "Vietnam", {
      shouldValidate: true,
    });
    setValue("zip", normalized.zip || "", { shouldValidate: true });
  };
  const onSubmit = async (data: any) => {
    try {
      const addressData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
        province: data.province,
        ward: data.ward,
        country: data.country,
        lat: mapPosition?.lat,
        lng: mapPosition?.lng,
      };

      if (editingAddress) {
        await updateAddress({ id: editingAddress.id, ...addressData }).unwrap();
        showSnackbar("Cập nhật địa chỉ thành công", "success");
      } else {
        await addAddress(addressData).unwrap();
        showSnackbar("Thêm địa chỉ mới thành công", "success");
      }

      resetForm();
      await refetch();
    } catch (err: any) {
      showSnackbar(
        err?.data?.message || "Có lỗi xảy ra khi lưu địa chỉ",
        "error"
      );
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
  
    const [firstName, ...lastNameParts] = address.name?.split(" ") || [];
  
    reset({
      firstName,
      lastName: lastNameParts.join(" "),
      phone: address.phone,

      address1: address.address1,
      address2: address.address2,

      province: (address as any).province || address.state || "",
      ward: (address as any).ward || address.city || "",

      country: address.country,
      zip: address.zip,
    });
  
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await deleteAddress(id).unwrap();
      showSnackbar("Đã xóa địa chỉ", "success");
      await refetch();
    } catch {
      showSnackbar("Không thể xóa địa chỉ", "error");
    }
  };

  // Handle setting default address
  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefaultAddress(id).unwrap();
        showSnackbar("Đã đặt địa chỉ mặc định", "success");
        await refetch();
      } catch {
        showSnackbar("Không thể cập nhật địa chỉ mặc định", "error");
      }
    },
    [setDefaultAddress, showSnackbar, refetch]
  );

  const resetForm = () => {
    reset();
    setEditingAddress(null);
    setShowMap(false);
    setMapPosition(undefined);
  };

  const isSubmitting = isAdding || isUpdating;

  // Render form input field with error handling
  const renderInput = (
    name: keyof typeof schema.fields,
    label: string,
    options: { type?: string; multiline?: boolean } = {}
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type={options.type || "text"}
          multiline={options.multiline}
          rows={options.multiline ? 3 : undefined}
          error={!!errors[name]}
          helperText={errors[name]?.message as string}
          variant="outlined"
          size="small"
        />
      )}
    />
  );

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderInput("firstName", "Tên")}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderInput("lastName", "Họ")}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderInput("phone", "Số điện thoại")}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1">Địa chỉ</Typography>
                <Suspense
                  fallback={
                    <Typography variant="subtitle1">Địa chỉ</Typography>
                  }
                >
                  <LocationSelectors
                    value={{
                      country: watch("country") || "Vietnam",
                      province: watch("province") || "",
                      ward: watch("ward") || "",
                    }}
                    onChange={handleLocationChange}
                  />
                </Suspense>

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowMap(!showMap)}
                    startIcon={
                      showMap ? <EyeOff size={16} /> : <Map size={16} />
                    }
                    sx={{ mb: 1 }}
                  >
                    {showMap ? "Ẩn bản đồ" : "Chọn vị trí trên bản đồ"}
                  </Button>
                  {showMap && (
                    <Box
                      sx={{
                        height: 300,
                        width: "100%",
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Suspense
                        fallback={
                          <Box
                            sx={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CircularProgress />
                          </Box>
                        }
                      >
                        <AddressMapPicker
                          onLocationSelect={handleLocationSelect}
                          initialPosition={mapPosition}
                          address={watch("address1")}
                          onAddressChange={(address) =>
                            setValue("address1", address, {
                              shouldValidate: true,
                            })
                          }
                        />
                      </Suspense>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                {renderInput("address1", "Địa chỉ cụ thể")}
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address2"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Địa chỉ phụ (tùy chọn)"
                      variant="outlined"
                      size="small"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                {renderInput("zip", "Mã bưu chính")}
              </Grid>

              <Grid item xs={12}>
                <FormLabel>Loại địa chỉ</FormLabel>
                <Controller
                  name="addressType"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      <FormControlLabel
                        value="home"
                        control={<Radio />}
                        label="Nhà riêng"
                      />
                      <FormControlLabel
                        value="office"
                        control={<Radio />}
                        label="Văn phòng"
                      />
                      <FormControlLabel
                        value="other"
                        control={<Radio />}
                        label="Khác"
                      />
                    </RadioGroup>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="isDefault"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Đặt làm địa chỉ mặc định"
                    />
                  )}
                />
              </Grid>

              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="flex-end"
                gap={2}
              >
                {editingAddress && (
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting && <CircularProgress size={20} />}
                >
                  {editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Address List */}
        <Typography variant="h5" gutterBottom>
          Danh sách địa chỉ
        </Typography>

        {isLoadingAddresses ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : addresses.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography>Bạn chưa có địa chỉ nào</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {addresses.map((address) => (
              <Grid item xs={12} md={6} key={address.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Typography fontWeight="bold">{address.name}</Typography>
                      <Box>
                        <IconButton onClick={() => handleEdit(address)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => address.id && handleDelete(address.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    {address.isDefault && (
                      <Typography variant="caption" color="primary">
                        <Check fontSize="small" /> Địa chỉ mặc định
                      </Typography>
                    )}
                    <Typography variant="body2" mt={1}>
                      {formatAddressForDisplay(address)}
                    </Typography>
                    <Typography variant="body2">
                      Điện thoại: {address.phone}
                    </Typography>

                    {!address.isDefault && address.id && (
                      <Button
                        size="small"
                        onClick={() => handleSetDefault(address.id!)}
                      >
                        Đặt làm mặc định
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AddressPage;
