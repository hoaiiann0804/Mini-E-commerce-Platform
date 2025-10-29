# Fix for Image Upload URL Generation Issue

## Problem Description
The image upload functionality was returning relative URLs (e.g., `/uploads/images/...`) instead of full URLs (e.g., `http://localhost:8888/uploads/images/...`). This caused issues when the frontend tried to display or access uploaded images, especially in production environments where the base URL might differ.

## Root Cause Analysis
The issue was identified in multiple locations where image URLs were being constructed:

1. **ImageService.js**: The `uploadImage` and `convertBase64ToFile` methods were generating URLs using relative paths (`/uploads/${filePath}`)
2. **ImageController.js**: The `getImageById` and `getImagesByProductId` methods were also returning relative URLs when retrieving image data from the database

The application was missing a centralized way to generate full URLs that include the base server URL.

## Solution Implemented

### 1. Added Base URL Configuration
- Added a `BASE_URL` constant in `be/src/services/imageService.js`
- Uses `process.env.BASE_URL` environment variable with fallback to `http://localhost:8888`

### 2. Updated URL Generation in ImageService
- Modified `uploadImage` method to return full URLs: `${BASE_URL}/uploads/${filePath}`
- Modified `convertBase64ToFile` method to return full URLs: `${BASE_URL}/uploads/${filePath}`

### 3. Updated URL Generation in ImageController
- Modified `getImageById` method to construct full URLs: `${process.env.BASE_URL || 'http://localhost:8888'}/uploads/${image.filePath}`
- Modified `getImagesByProductId` method to construct full URLs for all images in the response

## Files Changed

### be/src/services/imageService.js
```javascript
// Added BASE_URL constant
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

// Updated uploadImage return object
return {
  // ... other fields
  url: `${BASE_URL}/uploads/${filePath}`,
  // ... other fields
};

// Updated convertBase64ToFile return object
return {
  // ... other fields
  url: `${BASE_URL}/uploads/${filePath}`,
  // ... other fields
};
```

### be/src/controllers/imageController.js
```javascript
// Updated getImageById method
res.status(200).json({
  status: "success",
  data: {
    ...image.toJSON(),
    url: `${process.env.BASE_URL || 'http://localhost:8888'}/uploads/${image.filePath}`,
  },
});

// Updated getImagesByProductId method
const imagesWithUrls = images.map((image) => ({
  ...image.toJSON(),
  url: `${process.env.BASE_URL || 'http://localhost:8888'}/uploads/${image.filePath.replace(/\\/g, '/')}`,
}));
```

## Impact
- All image upload endpoints now return full URLs that can be directly used by the frontend
- Image retrieval endpoints also return full URLs for consistency
- The solution is backward compatible and configurable via environment variables
- Frontend components like `ImageUploader` can now properly display uploaded images

## Testing Status
- Code changes have been implemented successfully
- No automated testing was performed as per user request
- Manual testing recommended for:
  - Image upload functionality
  - Image retrieval endpoints
  - Frontend image display components

## Environment Configuration
To use a different base URL in production, set the `BASE_URL` environment variable:
```bash
export BASE_URL=https://yourdomain.com
```

## Conclusion
The fix ensures that all image URLs returned by the API are full URLs, resolving issues with image display and accessibility in different environments. The implementation is clean, configurable, and maintains consistency across all image-related endpoints.
