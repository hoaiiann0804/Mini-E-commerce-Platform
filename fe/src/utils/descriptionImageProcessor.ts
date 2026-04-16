import { message } from 'antd';

// Update ProcessDescriptionOptions to use correct category type
export interface ProcessDescriptionOptions {
  productId?: string;
  category?: 'product' | 'user' | 'review';
  uploadImageFn: (params: {
    base64Data: string;
    options?: {
      category?: 'product' | 'user' | 'review';
      productId?: string;
    };
  }) => Promise<any>;
}

export interface ProcessDescriptionResult {
  processedDescription: string;
  uploadedImages: Array<{
    originalBase64: string;
    uploadedUrl: string;
    imageId: string;
  }>;
  hasChanges: boolean;
}

/**
 * Process description content to convert base64 images to uploaded files
 * @param description - HTML content from rich text editor
 * @param options - Processing options
 * @returns Promise with processed description and upload results
 */
export const processDescriptionImages = async (
  description: string,
  options: ProcessDescriptionOptions
): Promise<ProcessDescriptionResult> => {
  if (!description) {
    return {
      processedDescription: description,
      uploadedImages: [],
      hasChanges: false,
    };
  }

  // Find all base64 image data URLs in the description
  const base64ImageRegex = /data:image\/[a-zA-Z]*;base64,[A-Za-z0-9+/=]+/g;
  const base64Images = description.match(base64ImageRegex) || [];

  if (base64Images.length === 0) {
    return {
      processedDescription: description,
      uploadedImages: [],
      hasChanges: false,
    };
  }

  console.log(`Found ${base64Images.length} base64 images to convert`);

  let processedDescription = description;
  const uploadedImages: ProcessDescriptionResult['uploadedImages'] = [];
  let hasErrors = false;

  // Show loading message
  const loadingKey = 'converting-images';
  message.loading({
    content: `Đang convert ${base64Images.length} ảnh base64 thành file...`,
    key: loadingKey,
    duration: 0,
  });

  try {
    // Process each base64 image
    for (let i = 0; i < base64Images.length; i++) {
      const base64Data = base64Images[i];

      try {
        console.log(`Converting image ${i + 1}/${base64Images.length}`);

        // Update loading message
        message.loading({
          content: `Đang convert ảnh ${i + 1}/${base64Images.length}...`,
          key: loadingKey,
          duration: 0,
        });

        // Call API to convert base64 to uploaded file
        const result = await options.uploadImageFn({
          base64Data,
          options: {
            category: options.category || 'product',
            productId: options.productId,
          },
        });

        if (result?.data) {
          const uploadedUrl =
            typeof result?.data?.url === 'string' &&
            /^https?:\/\//i.test(result.data.url)
              ? result.data.url
              : `${(import.meta.env.VITE_API_URL || 'http://localhost:8888/api').replace(/\/api\/?$/, '')}${result.data.url}`;

          // Replace base64 with uploaded URL in description
          processedDescription = processedDescription.replace(
            base64Data,
            uploadedUrl
          );

          uploadedImages.push({
            originalBase64: base64Data,
            uploadedUrl,
            imageId: result.data.id,
          });

          console.log(
            `Successfully converted image ${i + 1}: ${result.data.fileName}`
          );
        } else {
          console.error(
            `Failed to convert image ${i + 1}: No data in response`
          );
          hasErrors = true;
        }
      } catch (error: any) {
        console.error(`Error converting image ${i + 1}:`, error);
        hasErrors = true;

        // Continue with other images even if one fails
        const errorMessage =
          error?.data?.message || error?.message || 'Unknown error';
        console.error(`Failed to convert image ${i + 1}: ${errorMessage}`);
      }
    }

    // Hide loading message
    message.destroy(loadingKey);

    // Show result message
    if (uploadedImages.length > 0) {
      if (hasErrors) {
        message.warning(
          `Đã convert ${uploadedImages.length}/${base64Images.length} ảnh thành công. Một số ảnh không thể convert.`
        );
      } else {
        message.success(
          `Đã convert thành công ${uploadedImages.length} ảnh base64 thành file!`
        );
      }
    } else if (hasErrors) {
      message.error('Không thể convert ảnh base64 nào. Vui lòng thử lại.');
    }

    return {
      processedDescription,
      uploadedImages,
      hasChanges: uploadedImages.length > 0,
    };
  } catch (error) {
    message.destroy(loadingKey);
    console.error('Error processing description images:', error);
    message.error('Có lỗi xảy ra khi convert ảnh base64');

    return {
      processedDescription: description, // Return original if error
      uploadedImages: [],
      hasChanges: false,
    };
  }
};

/**
 * Check if description contains base64 images
 * @param description - HTML content to check
 * @returns boolean indicating if base64 images are found
 */
export const hasBase64Images = (description: string): boolean => {
  if (!description) return false;
  const base64ImageRegex = /data:image\/[a-zA-Z]*;base64,[A-Za-z0-9+/=]+/g;
  return base64ImageRegex.test(description);
};

/**
 * Count base64 images in description
 * @param description - HTML content to check
 * @returns number of base64 images found
 */
export const countBase64Images = (description: string): number => {
  if (!description) return 0;
  const base64ImageRegex = /data:image\/[a-zA-Z]*;base64,[A-Za-z0-9+/=]+/g;
  const matches = description.match(base64ImageRegex);
  return matches ? matches.length : 0;
};
