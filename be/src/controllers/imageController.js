const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const imageService = require("../services/imageService");
const { AppError } = require("../middlewares/errorHandler");

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../uploads/temp");
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `temp_${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only image files are allowed (JPEG, PNG, GIF, WebP)", 400),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Maximum 10 files
  },
});

class ImageController {
  // Upload single image
  async uploadSingle(req, res, next) {
    try {
      const uploadMiddleware = upload.single("image");

      uploadMiddleware(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return next(
                new AppError("File too large. Maximum size is 10MB", 400)
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
            generateThumbs: req.body.generateThumbs !== "false",
            optimize: req.body.optimize !== "false",
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
      const uploadMiddleware = upload.array("images", 10);

      uploadMiddleware(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return next(
                new AppError("File too large. Maximum size is 10MB", 400)
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
            generateThumbs: req.body.generateThumbs !== "false",
            optimize: req.body.optimize !== "false",
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
          ...image.toJSON(),
          url: `/uploads/${image.filePath}`,
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
        url: `/uploads/${image.filePath.replace(/\\/g, '/')}`,
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

  // Convert base64 to file
  async convertBase64(req, res, next) {
    try {
      const { base64Data, category, productId } = req.body;

      if (!base64Data) {
        return next(new AppError("base64Data is required", 400));
      }

      const options = {
        category: category || "product",
        productId: productId || null,
        userId: req.user?.id || null,
      };

      const result = await imageService.convertBase64ToFile(
        base64Data,
        options
      );

      res.status(200).json({
        status: "success",
        message: "Base64 converted to file successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cleanup orphaned files
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
