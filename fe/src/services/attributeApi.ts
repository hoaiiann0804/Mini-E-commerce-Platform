import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const getApiBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:8888';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
};

const API_URL = getApiBaseUrl();

export interface AttributeValue {
  id: string;
  name: string;
  value: string;
  colorCode?: string;
  imageUrl?: string;
  priceAdjustment: number;
  sortOrder: number;
  isActive: boolean;
}

export interface AttributeGroup {
  id: string;
  name: string;
  description?: string;
  type: 'color' | 'config' | 'storage' | 'size' | 'custom';
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  values?: AttributeValue[];
}

export interface CreateAttributeGroupRequest {
  name: string;
  description?: string;
  type: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface CreateAttributeValueRequest {
  name: string;
  value: string;
  colorCode?: string;
  imageUrl?: string;
  priceAdjustment: number;
  sortOrder: number;
}

export const attributeApi = createApi({
  reducerPath: 'attributeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/attributes`,
    credentials: 'include',
  }),
  tagTypes: ['AttributeGroup', 'AttributeValue'],
  endpoints: (builder) => ({
    // Get all attribute groups
    getAttributeGroups: builder.query<
      {
        success: boolean;
        data: AttributeGroup[];
      },
      void
    >({
      query: () => '/groups',
      providesTags: ['AttributeGroup'],
    }),

    // Get attribute groups for a specific product
    getProductAttributeGroups: builder.query<
      {
        success: boolean;
        data: AttributeGroup[];
      },
      string
    >({
      query: (productId) => `/products/${productId}/groups`,
      providesTags: ['AttributeGroup'],
    }),

    // Create attribute group
    createAttributeGroup: builder.mutation<
      {
        success: boolean;
        data: AttributeGroup;
      },
      CreateAttributeGroupRequest
    >({
      query: (data) => ({
        url: '/groups',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AttributeGroup'],
    }),

    // Update attribute group
    updateAttributeGroup: builder.mutation<
      {
        success: boolean;
        data: AttributeGroup;
      },
      { id: string; data: Partial<CreateAttributeGroupRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/groups/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AttributeGroup'],
    }),

    // Delete attribute group
    deleteAttributeGroup: builder.mutation<
      {
        success: boolean;
      },
      string
    >({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AttributeGroup'],
    }),

    // Add attribute value
    addAttributeValue: builder.mutation<
      {
        success: boolean;
        data: AttributeValue;
      },
      { attributeGroupId: string; data: CreateAttributeValueRequest }
    >({
      query: ({ attributeGroupId, data }) => ({
        url: `/groups/${attributeGroupId}/values`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AttributeGroup', 'AttributeValue'],
    }),

    // Update attribute value
    updateAttributeValue: builder.mutation<
      {
        success: boolean;
        data: AttributeValue;
      },
      { id: string; data: Partial<CreateAttributeValueRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/values/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AttributeGroup', 'AttributeValue'],
    }),

    // Delete attribute value
    deleteAttributeValue: builder.mutation<
      {
        success: boolean;
      },
      string
    >({
      query: (id) => ({
        url: `/values/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AttributeGroup', 'AttributeValue'],
    }),

    // Assign attribute group to product
    assignAttributeGroupToProduct: builder.mutation<
      {
        success: boolean;
      },
      {
        productId: string;
        attributeGroupId: string;
        isRequired: boolean;
        sortOrder: number;
      }
    >({
      query: ({ productId, attributeGroupId, isRequired, sortOrder }) => ({
        url: `/products/${productId}/groups/${attributeGroupId}`,
        method: 'POST',
        body: { isRequired, sortOrder },
      }),
      invalidatesTags: ['AttributeGroup'],
    }),
  }),
});

export const {
  useGetAttributeGroupsQuery,
  useGetProductAttributeGroupsQuery,
  useCreateAttributeGroupMutation,
  useUpdateAttributeGroupMutation,
  useDeleteAttributeGroupMutation,
  useAddAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useAssignAttributeGroupToProductMutation,
} = attributeApi;
