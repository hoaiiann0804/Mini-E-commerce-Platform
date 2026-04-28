const imageService = require("../services/images/image.service");
const { AppError } = require("../middlewares/errorHandler");
const uploadCloudinary = require("../middlewares/cloudinaryUploadMiddleware");
const multer = require("multer");
class ImageController {
  // Upload single image
  async uploadSingle(req, res, next) {
    try {
      // Use the pre-configured uploadCloudinary middleware
      const uploadMiddleware = uploadCloudinary.single("image");

      uploadMiddleware(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return next(
                new AppError(
                  `File too large. Maximum size is ${process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024) : 5}MB`,
                  400
                )
              );
            }
            return next(new AppError(`Upload error: ${err.message}`, 400));
          }
          return next(err);
        }

        if (!req.file) {
          return next(new AppError("No file uploaded", 400));
        }

        try {
          const options = {
            category: req.body.category || "product",
            productId: req.body.productId || null,
            userId: req.user?.id || null,
            // generateThumbs and optimize are handled by Cloudinary now, no need to pass these options
            // If you need specific Cloudinary transformations, you'd add them to `cloudinaryUploadMiddleware.js` params
          };

          const result = await imageService.uploadImage(req.file, options);

          res.status(200).json({
            status: "success",
            message: "Image uploaded successfully",
            data: result,
          });
        } catch (error) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload multiple images
  async uploadMultiple(req, res, next) {
    try {
      // Use the pre-configured uploadCloudinary middleware
      const uploadMiddleware = uploadCloudinary.array("images", 10); // Max 10 files is defined in cloudinaryUploadMiddleware.js limits

      uploadMiddleware(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return next(
                new AppError(
                  `File too large. Maximum size is ${process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024) : 5}MB`,
                  400
                )
              );
            }
            if (err.code === "LIMIT_FILE_COUNT") {
              return next(new AppError("Too many files. Maximum is 10", 400));
            }
            return next(new AppError(`Upload error: ${err.message}`, 400));
          }
          return next(err);
        }

        if (!req.files || req.files.length === 0) {
          return next(new AppError("No files uploaded", 400));
        }

        try {
          const options = {
            category: req.body.category || "product",
            productId: req.body.productId || null,
            userId: req.user?.id || null,
            // generateThumbs and optimize are handled by Cloudinary now
            // If you need specific Cloudinary transformations, you'd add them to `cloudinaryUploadMiddleware.js` params
          };

          const result = await imageService.uploadMultipleImages(
            req.files,
            options
          );

          res.status(200).json({
            status: "success",
            message: `${result.count.successful} images uploaded successfully`,
            data: result,
          });
        } catch (error) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get image by ID
  async getImageById(req, res, next) {
    try {
      const { id } = req.params;
      const image = await imageService.getImageById(id);

      res.status(200).json({
        status: "success",
        data: {
          ...image.toJSON(), // image.filePath now directly contains the Cloudinary URL
          url: image.filePath, // Use the Cloudinary URL directly
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get images by product ID
  async getImagesByProductId(req, res, next) {
    try {
      const { productId } = req.params;
      const images = await imageService.getImagesByProductId(productId);

      const imagesWithUrls = images.map((image) => ({
        ...image.toJSON(),
        url: image.filePath, // Use the Cloudinary URL directly
      }));

      res.status(200).json({
        status: "success",
        data: {
          images: imagesWithUrls,
          count: images.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete image
  async deleteImage(req, res, next) {
    try {
      const { id } = req.params;
      await imageService.deleteImage(id);

      res.status(200).json({
        status: "success",
        message: "Image deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // Convert base64 to file (may be unimplemented depending on storage backend)
  async convertBase64(req, res, next) {
    try {
      const { base64Data, category, productId } = req.body || {};

      if (!base64Data) {
        return next(new AppError("base64Data is required", 400));
      }

      const options = {
        category: category || "product",
        productId: productId || null,
        userId: req.user?.id || null,
      };

      const result = await imageService.convertBase64ToFile(base64Data, options);

      res.status(200).json({
        status: "success",
        message: "Base64 converted to file successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cleanup orphaned files (admin)
  async cleanupOrphanedFiles(req, res, next) {
    try {
      const result = await imageService.cleanupOrphanedFiles();

      res.status(200).json({
        status: "success",
        message: "Orphaned files cleaned up successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check for image service
  async healthCheck(req, res, next) {
    try {
      res.status(200).json({
        status: "success",
        message: "Image service is healthy",
        data: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImageController();
