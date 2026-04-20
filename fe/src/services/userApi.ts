import { api } from "./api";
import { User, Address } from "@/types/user.types";

// Re-export Address type
export type { Address } from "@/types/user.types";

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (userData) => {
        //console.log('Making API request to update profile:', userData);
        return {
          url: "/users/profile",
          method: "PUT",
          body: userData,
        };
      },
      transformResponse: (response: any) => {
        //console.log('Raw API response from update profile:', response);
        if (response?.status === "success") {
          return response.data;
        }
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.error("Error updating profile:", response);
        return response.data || "Failed to update profile";
      },
      invalidatesTags: ["CurrentUser"],
    }),

    changePassword: builder.mutation<
      { message: string },
      ChangePasswordRequest
    >({
      query: (passwordData) => ({
        url: "/users/change-password",
        method: "POST",
        body: passwordData,
      }),
      transformResponse: (response: any) => {
        if (response?.status === "success") {
          return { message: response.message };
        }
        return response;
      },
    }),

    getAddresses: builder.query<Address[], void>({
      query: () => ({
        url: "/users/addresses",
        method: "GET",
      }),
      transformResponse: (response: any) => {
        if (response?.status === "success") {
          return response.data;
        }
        return [];
      },
      providesTags: ["Addresses"],
    }),

    addAddress: builder.mutation<Address, Omit<Address, "id">>({
      query: (addressData) => ({
        url: "/users/addresses",
        method: "POST",
        body: addressData,
      }),
      transformResponse: (response: any) => {
        if (response?.status === "success") {
          return response.data;
        }
        return response;
      },
      invalidatesTags: ["Addresses"],
    }),

    updateAddress: builder.mutation<Address, Partial<Address> & { id: string }>(
      {
        query: ({ id, ...addressData }) => ({
          url: `/users/addresses/${id}`,
          method: "PUT",
          body: addressData,
        }),
        transformResponse: (response: any) => {
          if (response?.status === "success") {
            return response.data;
          }
          return response;
        },
        invalidatesTags: ["Addresses"],
      }
    ),

    deleteAddress: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/addresses/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => {
        if (response?.status === "success") {
          return { message: response.message };
        }
        return response;
      },
      invalidatesTags: ["Addresses"],
    }),

    setDefaultAddress: builder.mutation<Address, string>({
      query: (id) => ({
        url: `/users/addresses/${id}/default`,
        method: "PATCH",
      }),
      transformResponse: (response: any) => {
        if (response?.status === "success") {
          return response.data;
        }
        return response;
      },
      invalidatesTags: ["Addresses"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = userApi;
