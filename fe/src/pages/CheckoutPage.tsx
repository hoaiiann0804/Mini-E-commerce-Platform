import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Radio, Space, Divider } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";

// Add address related imports and types
import { useGetAddressesQuery } from "@/services/userApi";
import type { Address } from "@/types/user.types";

import CustomButton from "@/components/common/Button";
import PremiumButton from "@/components/common/PremiumButton";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import CartItem from "@/components/features/CartItem";
import StripePaymentForm from "@/components/payment/StripePaymentForm";
import BankTransferQR from "@/components/payment/BankTransferQR";
import { RootState } from "@/store";
import { clearCart, initializeCart, addItem } from "@/features/cart/cartSlice";
import { addNotification } from "@/features/ui/uiSlice";
import { formatPrice } from "@/utils/format";
import { useCreateOrderMutation } from "@/services/orderApi";
import { cartApi, useGetCartCountQuery } from "@/services/cartApi";

const CheckoutPage: React.FC = () => {
  const { t } = useTranslation();
  const { items } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Address management state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isUsingCustomAddress, setIsUsingCustomAddress] = useState(false);

  // Fetch user's addresses
  const { data: addresses = [], isLoading: isLoadingAddresses } = useGetAddressesQuery();

  // Find the default address
  const defaultAddress = addresses.find(addr => addr.isDefault);

  // Set default address when addresses are loaded
  useEffect(() => {
    if (defaultAddress && !selectedAddressId && !isUsingCustomAddress) {
      setSelectedAddressId(defaultAddress.id);
      // Pre-fill form with default address
      fillFormWithAddress(defaultAddress);
    }
  }, [defaultAddress, selectedAddressId, isUsingCustomAddress]);

  // Helper function to fill form with address data
  const fillFormWithAddress = (address: Address) => {
    const [firstName, ...lastNameParts] = address.name?.split(" ") || [];
    setFormData(prev => ({
      ...prev,
      firstName: firstName || "",
      lastName: lastNameParts.join(" ") || "",
      phone: address.phone || "",
      address: address.address1 || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zip || "",
      country: address.country || "VN",
    }));
  };

  // Handle address selection
  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id);
    setIsUsingCustomAddress(false);
    fillFormWithAddress(address);
  };

  // Handle using custom address
  const handleUseCustomAddress = () => {
    setSelectedAddressId(null);
    setIsUsingCustomAddress(true);
    // Reset form fields
    setFormData(prev => ({
      ...prev,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "VN",
    }));
  };

  // Đảm bảo giỏ hàng được khởi tạo khi trang được tải
  useEffect(() => {
    // Kiểm tra xem URL có chứa tham số
    const searchParams = new URLSearchParams(window.location.search);
    const isBuyNow = searchParams.get("buyNow") === "true";

    // Kiểm tra cả hai loại URL (cũ và mới)
    const repayOrderId =
      searchParams.get("repayOrder") || searchParams.get("orderId");
    const repayAmount = searchParams.get("amount");

    // Kiểm tra xem URL có phải là URL cũ không (/checkout/payment)
    const isOldPaymentUrl =
      window.location.pathname.includes("/checkout/payment");

    // Nếu là URL cũ, chuyển hướng đến URL mới
    if (isOldPaymentUrl && repayOrderId && repayAmount) {
      navigate(`/checkout?repayOrder=${repayOrderId}&amount=${repayAmount}`, {
        replace: true,
      });
      return;
    }

    // Kiểm tra xem người dùng đang thanh toán lại đơn hàng hay không
    if (repayOrderId && repayAmount) {
      console.log("Repaying order:", repayOrderId, "amount:", repayAmount);

      // Đặt thông tin đơn hàng hiện tại để thanh toán
      setCurrentOrder({
        id: repayOrderId,
        total: parseFloat(repayAmount),
        isRepay: true,
      });

      // Đặt phương thức thanh toán mặc định
      setFormData((prev) => ({
        ...prev,
        paymentMethod: "stripe",
      }));

      return;
    }

    // Kiểm tra xem người dùng vừa thực hiện hành động "Mua ngay" hay không
    const isBuyNowAction = sessionStorage.getItem("buyNowAction") === "true";

    // Nếu người dùng vừa thực hiện hành động "Mua ngay", không chuyển hướng
    if (isBuyNow || isBuyNowAction) {
      // Xóa cờ sau khi đã sử dụng
      sessionStorage.removeItem("buyNowAction");

      // Đảm bảo giỏ hàng được khởi tạo
      dispatch(initializeCart());

      // Nếu có thông tin sản phẩm mua ngay trong sessionStorage, thêm vào giỏ hàng
      const buyNowItemStr = sessionStorage.getItem("buyNowItem");
      if (buyNowItemStr) {
        try {
          const buyNowItem = JSON.parse(buyNowItemStr);
          // Thêm sản phẩm vào giỏ hàng nếu chưa có
          dispatch(addItem(buyNowItem));
          // Xóa thông tin sản phẩm sau khi đã sử dụng
          sessionStorage.removeItem("buyNowItem");
        } catch (error) {
          console.error("Error parsing buyNowItem:", error);
        }
      }

      return;
    }

    // Khởi tạo giỏ hàng
    dispatch(initializeCart());

    // Kiểm tra localStorage trực tiếp để đảm bảo không có dữ liệu giỏ hàng cũ
    // Chỉ chuyển hướng nếu không phải đang thanh toán lại đơn hàng
    const cartItems = localStorage.getItem("cartItems");
    if ((!cartItems || cartItems === "[]") && !repayOrderId) {
      navigate("/shop");
      dispatch(
        addNotification({
          type: "info",
          message: t("checkout.emptyCart.redirectMessage"),
        })
      );
    }
  }, [dispatch, navigate, t]);

  const [createOrder] = useCreateOrderMutation();

  // Lấy số lượng giỏ hàng từ server
  const { data: serverCartCount } = useGetCartCountQuery();

  // Payment methods with i18n
  const paymentMethods = [
    { value: "stripe", label: t("checkout.paymentMethod.creditCard") },
    { value: "bank_transfer", label: t("checkout.paymentMethod.bankTransfer") },
  ];

  // Shipping methods with i18n
  const shippingMethods = [
    {
      value: "standard",
      label: t("checkout.shippingMethod.standard"),
      price: 30000,
    },
    {
      value: "express",
      label: t("checkout.shippingMethod.express"),
      price: 50000,
    },
    {
      value: "free",
      label: t("checkout.shippingMethod.free"),
      price: 0,
    },
  ];

  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "", // Sử dụng số điện thoại của người dùng nếu có
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "VN",
    shippingMethod: "standard",
    paymentMethod: "stripe",
    notes: "",
    // Billing address (same as shipping by default)
    billingFirstName: user?.firstName || "",
    billingLastName: user?.lastName || "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
    billingCountry: "VN",
    billingPhone: user?.phone || "", // Sử dụng số điện thoại của người dùng nếu có
    sameAsShipping: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  // Debug log
  console.log("CheckoutPage render - currentOrder:", currentOrder);
  console.log("CheckoutPage render - paymentMethod:", formData.paymentMethod);

  // Countries list
  const countries = [
    { value: "VN", label: t("checkout.countries.VN") },
    { value: "US", label: t("checkout.countries.US") },
    { value: "CA", label: t("checkout.countries.CA") },
    { value: "UK", label: t("checkout.countries.UK") },
    { value: "AU", label: t("checkout.countries.AU") },
    { value: "DE", label: t("checkout.countries.DE") },
    { value: "FR", label: t("checkout.countries.FR") },
  ];

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const selectedShipping = shippingMethods.find(
    (method) => method.value === formData.shippingMethod
  );
  const shippingCost = selectedShipping?.price || 0;
  const tax = subtotal * 0.07; // 7% tax
  const total = subtotal + shippingCost + tax;

  // Handle form input changes
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Auto-fill billing address if same as shipping
    if (formData.sameAsShipping && name.startsWith("shipping")) {
      const billingField = name.replace("shipping", "billing");
      setFormData((prev) => ({
        ...prev,
        [billingField]: value,
      }));
    }
  };

  // Handle same as shipping checkbox
  const handleSameAsShipping = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sameAsShipping: checked,
      ...(checked && {
        billingFirstName: prev.firstName,
        billingLastName: prev.lastName,
        billingAddress: prev.address,
        billingCity: prev.city,
        billingState: prev.state,
        billingZipCode: prev.zipCode,
        billingCountry: prev.country,
        billingPhone: prev.phone,
      }),
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = t("checkout.validation.required");
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("checkout.validation.emailInvalid");
    }

    // Phone validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = t("checkout.validation.phoneInvalid");
    }

    // Billing address validation if not same as shipping
    if (!formData.sameAsShipping) {
      const billingFields = [
        "billingFirstName",
        "billingLastName",
        "billingAddress",
        "billingCity",
        "billingState",
        "billingZipCode",
        "billingCountry",
      ];

      billingFields.forEach((field) => {
        if (!formData[field as keyof typeof formData]) {
          newErrors[field] = t("checkout.validation.required");
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create order
  const handleCreateOrder = async () => {
    if (!validateForm()) {
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return null;
    }

    try {
      const orderData = {
        shippingFirstName: formData.firstName,
        shippingLastName: formData.lastName,
        shippingAddress1: formData.address,
        shippingCity: formData.city,
        shippingState: formData.state,
        shippingZip: formData.zipCode,
        shippingCountry: formData.country,
        shippingPhone: formData.phone,
        billingFirstName: formData.sameAsShipping
          ? formData.firstName
          : formData.billingFirstName,
        billingLastName: formData.sameAsShipping
          ? formData.lastName
          : formData.billingLastName,
        billingAddress1: formData.sameAsShipping
          ? formData.address
          : formData.billingAddress,
        billingCity: formData.sameAsShipping
          ? formData.city
          : formData.billingCity,
        billingState: formData.sameAsShipping
          ? formData.state
          : formData.billingState,
        billingZip: formData.sameAsShipping
          ? formData.zipCode
          : formData.billingZipCode,
        billingCountry: formData.sameAsShipping
          ? formData.country
          : formData.billingCountry,
        billingPhone: formData.sameAsShipping
          ? formData.phone
          : formData.billingPhone,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      const response = await createOrder(orderData).unwrap();
      return response.data.order;
    } catch (error) {
      console.error("Failed to create order:", error);
      dispatch(
        addNotification({
          type: "error",
          message: t("checkout.errors.orderCreationFailed"),
          duration: 5000,
        })
      );
      return null;
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent: any) => {
    dispatch(
      addNotification({
        type: "success",
        message: t("checkout.success.message"),
        duration: 5000,
      })
    );

    // Clear cart
    dispatch(clearCart());

    // Refetch cart count to update header badge
    dispatch(cartApi.util.invalidateTags(["CartCount"]));

    // Redirect to orders page
    navigate("/orders");
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    dispatch(
      addNotification({
        type: "error",
        message: error,
        duration: 5000,
      })
    );
  };

  // Handle payment processing state
  const handlePaymentProcessing = (processing: boolean) => {
    setIsProcessing(processing);
  };

  // Handle creating order for Stripe payment
  const handleStripeOrderCreation = async () => {
    console.log("Creating order for Stripe payment...");
    const order = await handleCreateOrder();
    console.log("Order created:", order);
    if (order) {
      setCurrentOrder(order);
      console.log("Current order set:", order);
    }
  };

  // Handle form submission for non-Stripe payments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.paymentMethod === "stripe") {
      // For Stripe, create order first
      await handleStripeOrderCreation();
      return;
    }

    // For other payment methods, handle differently
    const order = await handleCreateOrder();
    if (order) {
      dispatch(
        addNotification({
          type: "success",
          message: t("checkout.success.message"),
          duration: 5000,
        })
      );
      dispatch(clearCart());

      // Refetch cart count to update header badge
      dispatch(cartApi.util.invalidateTags(["CartCount"]));

      navigate("/orders");
    }
  };

  // Trạng thái loading cho giỏ hàng
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Kiểm tra giỏ hàng sau khi đã khởi tạo
  useEffect(() => {
    // Kiểm tra xem URL có chứa tham số
    const searchParams = new URLSearchParams(window.location.search);
    const isBuyNow = searchParams.get("buyNow") === "true";
    const repayOrderId =
      searchParams.get("repayOrder") || searchParams.get("orderId");

    // Kiểm tra xem người dùng vừa thực hiện hành động "Mua ngay" hay không
    const isBuyNowAction = sessionStorage.getItem("buyNowAction") === "true";

    // Đặt một timeout dài hơn để đảm bảo giỏ hàng đã được khởi tạo và API đã cập nhật
    const timer = setTimeout(() => {
      setIsCartLoading(false);

      // Nếu người dùng vừa thực hiện hành động "Mua ngay" hoặc đang thanh toán lại đơn hàng, không chuyển hướng
      if (isBuyNow || isBuyNowAction || repayOrderId) {
        // Xóa cờ sau khi đã sử dụng
        sessionStorage.removeItem("buyNowAction");

        // Nếu có thông tin sản phẩm mua ngay trong sessionStorage, thêm vào giỏ hàng
        const buyNowItemStr = sessionStorage.getItem("buyNowItem");
        if (buyNowItemStr) {
          try {
            const buyNowItem = JSON.parse(buyNowItemStr);
            // Thêm sản phẩm vào giỏ hàng nếu chưa có
            dispatch(addItem(buyNowItem));
            // Xóa thông tin sản phẩm sau khi đã sử dụng
            sessionStorage.removeItem("buyNowItem");
          } catch (error) {
            console.error("Error parsing buyNowItem:", error);
          }
        }

        return;
      }

      // Kiểm tra cả serverCartCount và items trong Redux store
      // Chỉ chuyển hướng nếu cả hai đều trống và không phải đang thanh toán lại đơn hàng
      if (
        serverCartCount === 0 &&
        (!items || items.length === 0) &&
        !repayOrderId
      ) {
        // Xóa dữ liệu giỏ hàng trong localStorage để đảm bảo không có dữ liệu cũ
        localStorage.removeItem("cartItems");

        // Cập nhật state Redux
        dispatch(initializeCart());

        // Chuyển hướng về trang shop
        navigate("/shop");
        dispatch(
          addNotification({
            type: "info",
            message: t("checkout.emptyCart.redirectMessage"),
          })
        );
      }
    }, 800); // Tăng thời gian chờ để đảm bảo API có đủ thời gian cập nhật

    return () => clearTimeout(timer);
  }, [items, serverCartCount, navigate, dispatch, t]);

  // Hiển thị loading trong khi kiểm tra giỏ hàng
  if (isCartLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  // Không cần kiểm tra giỏ hàng trống ở đây nữa vì đã chuyển hướng trong useEffect

  // Kiểm tra xem có phải đang thanh toán lại đơn hàng không
  const isRepayingOrder = currentOrder && currentOrder.isRepay;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
        {isRepayingOrder ? t("checkout.repayTitle") : t("checkout.title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Forms */}
        <div className="space-y-8">
          {/* Shipping Information - Ẩn khi thanh toán lại */}
          {!isRepayingOrder && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-6">
                {t("checkout.shippingInfo.title")}
              </h2>

              {/* Address Selection */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  {t("checkout.selectAddress")}
                </h3>

                {isLoadingAddresses ? (
                  <div className="flex justify-center py-4">
                    <LoadingOutlined className="text-2xl" />
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <Radio.Group
                      value={isUsingCustomAddress ? 'custom' : selectedAddressId}
                      className="w-full"
                    >
                      <Space direction="vertical" className="w-full">
                        {addresses.map((address) => (
                          <Radio
                            key={address.id}
                            value={address.id}
                            onChange={() => handleAddressSelect(address)}
                            className="w-full p-3 border rounded-md hover:border-primary-500 transition-colors"
                          >
                            <div className="ml-2">
                              <div className="flex items-center">
                                <span className="font-medium">{address.name}</span>
                                {address.isDefault && (
                                  <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                                    {t('address.default')}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                {address.address1}, {address.city}, {address.state}, {address.country}
                              </div>
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                {address.phone}
                              </div>
                            </div>
                          </Radio>
                        ))}

                        <Radio
                          value="custom"
                          checked={isUsingCustomAddress}
                          onChange={handleUseCustomAddress}
                          className="w-full p-3 border rounded-md hover:border-primary-500 transition-colors"
                        >
                          <div className="ml-2">
                            <div className="font-medium">{t('checkout.useCustomAddress')}</div>
                          </div>
                        </Radio>
                      </Space>
                    </Radio.Group>

                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => navigate('/account/addresses')}
                      className="p-0 text-sm"
                    >
                      {t('checkout.manageAddresses')}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("checkout.shippingInfo.firstName")}
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  error={errors.firstName}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <Input
                  label={t("checkout.shippingInfo.lastName")}
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  error={errors.lastName}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <Input
                  label={t("checkout.shippingInfo.email")}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={errors.email}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <Input
                  label={t("checkout.shippingInfo.phone")}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  error={errors.phone}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label={t("checkout.shippingInfo.address")}
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    error={errors.address}
                    disabled={!isUsingCustomAddress && selectedAddressId !== null}
                    required
                  />
                </div>
                <Input
                  label={t("checkout.shippingInfo.city")}
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  error={errors.city}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <Input
                  label={t("checkout.shippingInfo.state")}
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  error={errors.state}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <Input
                  label={t("checkout.shippingInfo.zipCode")}
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  error={errors.zipCode}
                  disabled={!isUsingCustomAddress && selectedAddressId !== null}
                  required
                />
                <div className="md:col-span-2">
                  <Select
                    label={t("checkout.shippingInfo.country")}
                    value={formData.country}
                    onChange={(value) => handleInputChange("country", value)}
                    options={countries}
                    error={errors.country}
                    disabled={!isUsingCustomAddress && selectedAddressId !== null}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shipping Method - Hidden when repaying order */}
          {!isRepayingOrder && (
            <div className="space-y-3">
              {shippingMethods.map((method) => (
                <label
                  key={method.value}
                  className="flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={method.value}
                    checked={formData.shippingMethod === method.value}
                    onChange={(e) =>
                      handleInputChange("shippingMethod", e.target.value)
                    }
                    className="mr-3"
                  />
                  <div className="flex-grow">
                    <div className="font-medium text-neutral-800 dark:text-neutral-100">
                      {method.label}
                    </div>
                  </div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {method.price === 0
                      ? t("checkout.shippingMethod.freeLabel")
                      : formatPrice(method.price)}
                  </div>
                </label>
              ))}
            </div>
          
          )}

        {/* Payment Method */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-6">
            {isRepayingOrder
              ? t("checkout.repaymentMethod.title")
              : t("checkout.paymentMethod.title")}
          </h2>

          <div className="space-y-3 mb-6">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className="flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={formData.paymentMethod === method.value}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  className="mr-3"
                />
                <div className="font-medium text-neutral-800 dark:text-neutral-100">
                  {method.label}
                </div>
              </label>
            ))}
          </div>

          {/* Other payment methods info */}
          {/* PayPal section removed */}

          {formData.paymentMethod === "bank_transfer" && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              {!currentOrder ? (
                <>
                  <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                    {t("checkout.bankTransfer.instructions")}
                  </h4>
                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <p className="text-blue-700 dark:text-blue-300 font-medium">
                      Vui lòng tạo đơn hàng trước để nhận mã QR thanh toán
                    </p>
                    <p>
                      Mã QR thanh toán sẽ được hiển thị sau khi bạn tạo đơn
                      hàng
                    </p>
                  </div>
                </>
              ) : (
                <BankTransferQR
                  amount={total / 100}
                  orderId={currentOrder.id}
                />
              )}
            </div>
          )}
        </div>

        {/* Order Notes */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
            Order Notes (Optional)
          </h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Any special instructions for your order..."
            className="w-full p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            rows={3}
          />
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 sticky top-4">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-6">
            {t("checkout.orderSummary.title")}
          </h2>

          {/* Cart Items or Repay Order */}
          {isRepayingOrder ? (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-blue-800 dark:text-blue-200">
                  <div className="font-semibold mb-2">
                    {t("checkout.repayOrder.title")}
                  </div>
                  <div className="text-sm mb-1">
                    {t("checkout.repayOrder.id")}: {currentOrder.id}
                  </div>
                  <div className="text-lg font-semibold">
                    {t("checkout.repayOrder.amount")}:{" "}
                    {formatPrice(currentOrder.total)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <CartItem
                  key={`${item.id}-${item.variantId || "default"}`}
                  item={item}
                  readonly
                />
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
            {!isRepayingOrder ? (
              <>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{t("checkout.orderSummary.subtotal")}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{t("checkout.orderSummary.shipping")}</span>
                  <span>
                    {shippingCost === 0
                      ? t("checkout.orderSummary.freeShipping")
                      : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{t("checkout.orderSummary.tax")}</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-neutral-800 dark:text-neutral-100 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span>{t("checkout.orderSummary.total")}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                <span>{t("checkout.orderSummary.total")}</span>
                <span>{formatPrice(currentOrder.total)}</span>
              </div>
            )}
          </div>

          {/* Complete Order Button (for bank transfer after QR is shown) */}
          {formData.paymentMethod === "bank_transfer" && currentOrder && (
            <PremiumButton
              variant="success"
              size="large"
              iconType="check"
              isProcessing={isProcessing}
              processingText="Đang xử lý..."
              onClick={() => handlePaymentSuccess({ id: currentOrder.id })}
              className="w-full mt-6 h-14 text-lg font-semibold"
            >
              Tôi đã thanh toán
            </PremiumButton>
          )}

          {/* Create Order Button for Bank Transfer */}
          {formData.paymentMethod === "bank_transfer" && !currentOrder && (
            <PremiumButton
              variant="primary"
              size="large"
              iconType="arrow-right"
              isProcessing={isProcessing}
              processingText="Processing..."
              onClick={handleStripeOrderCreation} // Reuse the same function for creating order
              className="w-full mt-6 h-14 text-lg font-semibold"
            >
              {t("checkout.createOrder") || "Tạo đơn hàng và nhận mã QR"}
            </PremiumButton>
          )}

          {/* Create Order Button (for Stripe) */}
          {formData.paymentMethod === "stripe" && !currentOrder && (
            <PremiumButton
              variant="primary"
              size="large"
              iconType="arrow-right"
              isProcessing={isProcessing}
              processingText="Processing..."
              onClick={handleStripeOrderCreation}
              className="w-full mt-6 h-14 text-lg font-semibold"
            >
              Continue to Payment
            </PremiumButton>
          )}

          {/* Stripe Payment Form */}
          {formData.paymentMethod === "stripe" && currentOrder && (
            <div className="mt-6">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-blue-800 dark:text-blue-200">
                  <div className="font-semibold">
                    {currentOrder.isRepay
                      ? "Thanh toán lại đơn hàng"
                      : "Order Created Successfully!"}
                  </div>
                  {currentOrder.number && (
                    <div className="text-sm">
                      Order #{currentOrder.number}
                    </div>
                  )}
                  <div className="text-sm">
                    Please complete your payment below.
                  </div>
                </div>
              </div>
              <StripePaymentForm
                amount={parseFloat(currentOrder.total) / 25000} // Convert VND to USD (approximate rate)
                currency="usd"
                orderId={currentOrder.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onProcessing={handlePaymentProcessing}
              />
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center text-green-800 dark:text-green-200">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <div className="font-semibold">
                  {t("checkout.securityNotice.title")}
                </div>
                <div className="text-sm">
                  {t("checkout.securityNotice.message")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div >
  );
};

export default CheckoutPage;
