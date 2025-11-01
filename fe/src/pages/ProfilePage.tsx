import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Button from "@/components/common/Button";
import { PremiumButton } from "@/components/common";
import Input from "@/components/common/Input";
import { RootState } from "@/store";
import { updateUser } from "@/features/auth/authSlice";
import { addNotification } from "@/features/ui/uiSlice";
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "@/services/userApi";
import { useGetCurrentUserQuery } from "@/services/authApi";

const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // API hooks
  const { data: currentUser, isLoading: isLoadingUser } =
    useGetCurrentUserQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

    // Only validate password fields if any of them are filled
    if (
      formData.currentPassword ||
      formData.newPassword ||
      formData.confirmPassword
    ) {
      if (!formData.currentPassword) {
        newErrors.currentPassword =
          "Current password is required to change password";
      }

      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your new password";
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
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

      // Change password if provided
      if (formData.currentPassword && formData.newPassword) {
        await changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }).unwrap();

        dispatch(
          addNotification({
            type: "success",
            message: "Password changed successfully",
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

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
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
          My Profile
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

                {isEditing && (
                  <>
                    <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4 mt-8">
                      Change Password
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <Input
                        label="Current Password"
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        error={errors.currentPassword}
                        placeholder="••••••••"
                      />

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="New Password"
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          error={errors.newPassword}
                          placeholder="••••••••"
                        />

                        <Input
                          label="Confirm New Password"
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          error={errors.confirmPassword}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-8">
                      <PremiumButton
                        variant="ghost"
                        size="large"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            firstName:
                              currentUser?.firstName || user?.firstName || "",
                            lastName:
                              currentUser?.lastName || user?.lastName || "",
                            email: currentUser?.email || user?.email || "",
                            phone: currentUser?.phone || user?.phone || "",
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
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
                        isProcessing={isUpdating || isChangingPassword}
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

export default ProfilePage;
