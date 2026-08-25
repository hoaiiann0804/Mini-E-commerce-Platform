import { api } from './api';
import { RootState } from '@/store';

export interface UploadResponse {
  status: string;
  message: string;
  data: {
    filename: string;
    originalName: string;
    url: string;
    size: number;
    type: string;
  };
}

export interface MultipleUploadResponse {
  status: string;
  message: string;
  data: {
    files: Array<{
      filename: string;
      originalName: string;
      url: string;
      size: number;
    }>;
    type: string;
    count: number;
  };
}

export const uploadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadSingle: builder.mutation<
      UploadResponse,
      { type: string; file: File }
    >({
      query: ({ type, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/upload/${type}/single`,
          method: 'POST',
          body: formData,
        };
      },
    }),

    uploadMultiple: builder.mutation<
      MultipleUploadResponse,
      { type: string; files: File[] }
    >({
      query: ({ type, files }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        return {
          url: `/upload/${type}/multiple`,
          method: 'POST',
          body: formData,
        };
      },
    }),

    deleteFile: builder.mutation<
      { status: string; message: string },
      { type: string; filename: string }
    >({
      query: ({ type, filename }) => ({
        url: `/upload/${type}/${filename}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useUploadSingleMutation,
  useUploadMultipleMutation,
  useDeleteFileMutation,
} = uploadApi;
