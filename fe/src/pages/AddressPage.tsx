import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Button from "@/components/common/Button";
import { PremiumButton } from "@/components/common";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import { RootState } from "@/store";
import { updateUser } from "@/features/auth/authSlice";
import { addNotification } from "@/features/ui/uiSlice";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
} from "@/services/userApi";
import { useGetCurrentUserQuery } from "@/services/authApi";

const AddressPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // API hooks
  const { data: currentUser, isLoading: isLoadingUser } =
    useGetCurrentUserQuery();
  const { data: addresses, isLoading: isLoadingAddresses } =
    useGetAddressesQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddress }] =
    useUpdateAddressMutation();

  const [formData, setFormData] = useState({
    // Profile fields
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    // Address fields
    name: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    isDefault: false,
  });

  const [addressId, setAddressId] = useState<string | null>(null);

  // Update form data when user data is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData((prevData) => ({
        ...prevData,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      }));
    }
  }, [currentUser]);

  // Update form data when addresses are loaded
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddress =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      setFormData((prevData) => ({
        ...prevData,
        name: defaultAddress.name || "",
        firstName: defaultAddress.firstName || prevData.firstName,
        lastName: defaultAddress.lastName || prevData.lastName,
        company: defaultAddress.company || "",
        address1: defaultAddress.address1 || "",
        address2: defaultAddress.address2 || "",
        city: defaultAddress.city || "",
        state: defaultAddress.state || "",
        zip: defaultAddress.zip || "",
        country: defaultAddress.country || "",
        phone: defaultAddress.phone || prevData.phone,
        isDefault: defaultAddress.isDefault || false,
      }));
      setAddressId(defaultAddress.id);
    }
  }, [addresses]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.address1) {
      newErrors.address1 = "Address Line 1 is required";
    }

    if (!formData.city) {
      newErrors.city = "City is required";
    }

    if (!formData.state) {
      newErrors.state = "State/Province is required";
    }

    if (!formData.zip) {
      newErrors.zip = "ZIP/Postal Code is required";
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Update profile information
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      console.log("Submitting profile data:", profileData);

      // Check if we have a token
      const token = localStorage.getItem("token");
      console.log("Current token:", token ? "exists" : "missing");

      const updatedUser = await updateProfile(profileData).unwrap();
      console.log("Profile update response:", updatedUser);

      // Update user in Redux store
      dispatch(
        updateUser({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
        })
      );

      // Handle address
      const addressData = {
        name: formData.name,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        phone: formData.phone,
        isDefault: formData.isDefault,
      };

      if (addressId) {
        await updateAddress({ id: addressId, ...addressData }).unwrap();
        dispatch(
          addNotification({
            type: "success",
            message: "Address updated successfully",
            duration: 3000,
          })
        );
      } else {
        await addAddress(addressData).unwrap();
        dispatch(
          addNotification({
            type: "success",
            message: "Address added successfully",
            duration: 3000,
          })
        );
      }

      dispatch(
        addNotification({
          type: "success",
          message: "Profile updated successfully",
          duration: 3000,
        })
      );

      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      dispatch(
        addNotification({
          type: "error",
          message: error.data?.message || "Failed to update profile",
          duration: 5000,
        })
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
          My Address
        </h1>

        {isLoadingUser ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                  Personal Information
                </h2>

                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-md font-semibold text-neutral-800 dark:text-neutral-100"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    disabled={!isEditing || isUpdating}
                    required
                  />

                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    disabled={!isEditing || isUpdating}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    disabled={true} // Email cannot be changed
                    required
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    disabled={!isEditing || isUpdating}
                  />
                </div>

                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4">
                  Address Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Input
                    label="Address Line 1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    error={errors.address1}
                    disabled={!isEditing || isUpdating}
                    required
                  />

                  <Input
                    label="Address Line 2"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    error={errors.address2}
                    disabled={!isEditing || isUpdating}
                  />

                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    disabled={!isEditing || isUpdating}
                    required
                  />

                  <Input
                    label="State/Province"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    disabled={!isEditing || isUpdating}
                    required
                  />

                  <Input
                    label="ZIP/Postal Code"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    error={errors.zip}
                    disabled={!isEditing || isUpdating}
                    required
                  />

                  <Input
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    error={errors.country}
                    disabled={!isEditing || isUpdating}
                    required
                  />
                </div>

                {isEditing && (
                  <>
                    <div className="flex justify-end space-x-4 mt-8">
                      <PremiumButton
                        variant="ghost"
                        size="large"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData((prev) => ({
                            ...prev,
                            firstName:
                              currentUser?.firstName || user?.firstName || "",
                            lastName:
                              currentUser?.lastName || user?.lastName || "",
                            email: currentUser?.email || user?.email || "",
                            phone: currentUser?.phone || user?.phone || "",
                            address1:
                              addresses?.find((addr) => addr.isDefault)
                                ?.address1 || "",
                            address2:
                              addresses?.find((addr) => addr.isDefault)
                                ?.address2 || "",
                            city:
                              addresses?.find((addr) => addr.isDefault)?.city ||
                              "",
                            state:
                              addresses?.find((addr) => addr.isDefault)
                                ?.state || "",
                            zip:
                              addresses?.find((addr) => addr.isDefault)?.zip ||
                              "",
                            country:
                              addresses?.find((addr) => addr.isDefault)
                                ?.country || "",
                          }));
                          setErrors({});
                        }}
                        className="mr-4"
                      >
                        Cancel
                      </PremiumButton>

                      <PremiumButton
                        variant="success"
                        size="large"
                        iconType="check"
                        isProcessing={isUpdating}
                        processingText="Saving..."
                        onClick={handleSubmit}
                      >
                        Save Changes
                      </PremiumButton>
                    </div>
                  </>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddressPage;
