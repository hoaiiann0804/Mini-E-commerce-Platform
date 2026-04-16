const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");
const Image = require("../models/image");
const Product = require("../models/product");
const { AppError } = require("../middlewares/errorHandler");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary (uploads are handled via multer-storage-cloudinary middleware)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Base URL for generating full image URLs
const BASE_URL = process.env.BASE_URL || "http://localhost:8888";

class ImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, "../../uploads");
    this.initializeDirectories();
  }

  // Initialize upload directories
  async initializeDirectories() {
    const dirs = [
      path.join(this.uploadDir, "temp"),
      path.join(this.uploadDir, "images/products"),
      path.join(this.uploadDir, "images/thumbnails"),
      path.join(this.uploadDir, "images/users"),
      path.join(this.uploadDir, "images/reviews"),
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  // Generate organized file path based on date
  generateFilePath(category, fileName) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Use forward slashes for URL compatibility
    return path
      .join("images", category, year.toString(), month, fileName)
      .replace(/\\/g, "/");
  }

  // Generate unique filename with UUID
  generateUniqueFileName(originalName) {
    const uuid = uuidv4();
    const ext = path.extname(originalName);
    return `${uuid}${ext}`;
  }

  // Get image dimensions
  async getImageDimensions(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch (error) {
      console.error("Error getting image dimensions:", error);
      return { width: null, height: null };
    }
  }

  // Process and optimize image
  async processImage(inputPath, outputPath, options = {}) {
    try {
      let sharpInstance = sharp(inputPath);

      // Resize if specified
      if (options.width || options.height) {
        sharpInstance = sharpInstance.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || "inside",
          withoutEnlargement: true,
        });
      }

      // Apply quality settings
      if (options.quality) {
        if (outputPath.endsWith(".jpg") || outputPath.endsWith(".jpeg")) {
          sharpInstance = sharpInstance.jpeg({ quality: options.quality });
        } else if (outputPath.endsWith(".png")) {
          sharpInstance = sharpInstance.png({ quality: options.quality });
        } else if (outputPath.endsWith(".webp")) {
          sharpInstance = sharpInstance.webp({ quality: options.quality });
        }
      }

      // Auto-orient based on EXIF data
      sharpInstance = sharpInstance.rotate();

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Save processed image
      await sharpInstance.toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error("Error processing image:", error);
      throw new AppError("Failed to process image", 500);
    }
  }

  // Generate thumbnails
  async generateThumbnails(originalPath, fileName, category) {
    const thumbnails = [];
    const thumbSizes = [
      { name: "small", width: 150, height: 150 },
      { name: "medium", width: 300, height: 300 },
      { name: "large", width: 600, height: 600 },
    ];

    for (const size of thumbSizes) {
      try {
        const thumbFileName = `${path.parse(fileName).name}_${size.name}${path.extname(fileName)}`;
        const thumbPath = this.generateFilePath("thumbnails", thumbFileName);
        const fullThumbPath = path.join(this.uploadDir, thumbPath);

        await this.processImage(originalPath, fullThumbPath, {
          width: size.width,
          height: size.height,
          quality: 85,
          fit: "cover",
        });

        thumbnails.push({
          size: size.name,
          path: thumbPath,
          fileName: thumbFileName,
        });
      } catch (error) {
        console.error(`Error generating ${size.name} thumbnail:`, error);
      }
    }

    return thumbnails;
  }

  // Upload and process single image
  async uploadImage(file, options = {}) {
    try {
      console.log("📤 Starting image upload:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        options,
      });

      const {
        category = "product",
        productId = null,
        userId = null,
        // With Cloudinary these are handled via transformations; kept for API compatibility
        generateThumbs = true,
        optimize = true,
      } = options;

      const cloudinaryPublicId = file.filename || file.public_id;
      const cloudinaryUrl = file.path || file.secure_url || file.url;

      if (!cloudinaryPublicId || !cloudinaryUrl) {
        throw new AppError(
          "Cloudinary upload did not return public_id or url",
          500
        );
      }

      const width = Number.isFinite(file.width) ? file.width : null;
      const height = Number.isFinite(file.height) ? file.height : null;
      const dimensions = { width, height };

      const mimeType =
        file.mimetype || (file.format ? `image/${file.format}` : "image/webp");
      const fileSize = file.size ?? file.bytes ?? 0;

      const imageRecord = await Image.create({
        originalName: file.originalname,
        fileName: cloudinaryPublicId,
        filePath: cloudinaryUrl,
        fileSize: fileSize,
        mimeType: mimeType,
        width,
        height,
        category: category,
        productId: productId,
        userId: userId,
      });

      const thumbnails = [];

      // Keep Product.images and Product.thumbnail in sync for FE compatibility
      if (productId) {
        try {
          const product = await Product.findByPk(productId);
          if (product) {
            const existingImages = Array.isArray(product.images)
              ? product.images
              : [];

            // Remove legacy local URLs/paths now that Cloudinary is the source of truth
            const cleanedImages = existingImages.filter((url) => {
              if (typeof url !== "string") return false;
              const trimmed = url.trim();
              if (!trimmed) return false;
              if (trimmed.startsWith("/uploads/")) return false;
              if (trimmed.startsWith("uploads/")) return false;
              if (trimmed.startsWith("images/")) return false;
              if (trimmed.includes("localhost:8888/uploads")) return false;
              // Drop legacy relative paths (FE prefixes these with /uploads/ which no longer exists)
              if (!/^https?:\/\//i.test(trimmed)) return false;
              return true;
            });

            const nextImages = Array.from(
              new Set([...cleanedImages, cloudinaryUrl])
            );

            product.images = nextImages;

            const thumb =
              typeof product.thumbnail === "string" ? product.thumbnail : "";
            if (
              !thumb ||
              thumb.startsWith("/uploads/") ||
              thumb.startsWith("uploads/") ||
              thumb.startsWith("images/") ||
              thumb.includes("localhost:8888/uploads")
            ) {
              product.thumbnail = cloudinaryUrl;
            }

            await product.save();
          }
        } catch (err) {
          console.warn(
            "Failed to sync Product images/thumbnail:",
            err?.message || err
          );
        }
      }

      return {
        id: imageRecord.id,
        fileName: cloudinaryPublicId,
        filePath: cloudinaryUrl,
        url: cloudinaryUrl, // The direct Cloudinary URL
        originalName: file.originalname,
        size: fileSize,
        dimensions,
        thumbnails,
        category,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to upload image", 500);
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files, options = {}) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, options);
        results.push(result);
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      count: {
        total: files.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  }

  // Get image by ID
  async getImageById(id) {
    try {
      const image = await Image.findByPk(id);
      if (!image) {
        throw new AppError("Image not found", 404);
      }
      return image;
    } catch (error) {
      throw error;
    }
  }

  // Delete image
  async deleteImage(id) {
    try {
      const image = await this.getImageById(id);
      if (!image) {
        throw new AppError("Image not found", 404);
      }

      // Delete from Cloudinary using its public_id (stored in image.fileName)
      await cloudinary.uploader.destroy(image.fileName);
      console.log(`🗑️ Deleted image from Cloudinary: ${image.fileName}`);

      // Sync Product.images/thumbnail (Product stores urls in its `images` field)
      if (image.productId) {
        try {
          const product = await Product.findByPk(image.productId);
          if (product) {
            const existingImages = Array.isArray(product.images)
              ? product.images
              : [];
            const nextImages = existingImages.filter(
              (url) => typeof url === "string" && url !== image.filePath
            );

            product.images = nextImages;
            if (product.thumbnail === image.filePath) {
              product.thumbnail = nextImages[0] || null;
            }

            await product.save();
          }
        } catch (err) {
          console.warn(
            "Failed to sync Product after image delete:",
            err?.message || err
          );
        }
      }

      // Delete from database
      await image.destroy();

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get images by product ID
  async getImagesByProductId(productId) {
    try {
      const images = await Image.findAll({
        where: { productId, isActive: true },
        order: [["createdAt", "ASC"]],
      });
      return images;
    } catch (error) {
      throw error;
    }
  }

  // NOTE: Functions like `convertBase64ToFile`, `cleanupOrphanedFiles`,
  // and `getAllFiles` are designed for local file system.
  // If you need similar functionality with Cloudinary, you would need to
  // implement them using Cloudinary's Admin API (e.g., search for assets, delete assets).
  // For this project, we'll assume direct uploads via Multer-Cloudinary.
  async convertBase64ToFile(base64Data, options = {}) {
    try {
      if (!base64Data || typeof base64Data !== "string") {
        throw new AppError("base64Data is required", 400);
      }

      const {
        category = "product",
        productId = null,
        userId = null,
      } = options;

      const trimmed = base64Data.trim();
      const isDataUrl = trimmed.startsWith("data:image/");

      // If client sends raw base64, assume png (recommend sending full data URL instead)
      const dataUrl = isDataUrl ? trimmed : `data:image/png;base64,${trimmed}`;

      const publicId = `img-${Date.now()}-${uuidv4()}`;

      const uploadResult = await cloudinary.uploader.upload(dataUrl, {
        folder: "ecommerce-mini",
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      });

      const cloudinaryPublicId = uploadResult.public_id;
      const cloudinaryUrl = uploadResult.secure_url || uploadResult.url;

      if (!cloudinaryPublicId || !cloudinaryUrl) {
        throw new AppError("Cloudinary upload failed", 500);
      }

      const mimeType = uploadResult.format
        ? `image/${uploadResult.format}`
        : "image";

      const imageRecord = await Image.create({
        originalName: isDataUrl ? "base64-image" : "base64-image.png",
        fileName: cloudinaryPublicId,
        filePath: cloudinaryUrl,
        fileSize: uploadResult.bytes || 0,
        mimeType,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        category,
        productId,
        userId,
      });

      // Keep Product.images and Product.thumbnail in sync (same behavior as multipart upload)
      if (productId) {
        try {
          const product = await Product.findByPk(productId);
          if (product) {
            const existingImages = Array.isArray(product.images)
              ? product.images
              : [];

            const cleanedImages = existingImages.filter((url) => {
              if (typeof url !== "string") return false;
              const u = url.trim();
              if (!u) return false;
              if (u.startsWith("/uploads/")) return false;
              if (u.startsWith("uploads/")) return false;
              if (u.startsWith("images/")) return false;
              if (u.includes("localhost:8888/uploads")) return false;
              if (!/^https?:\/\//i.test(u)) return false;
              return true;
            });

            product.images = Array.from(new Set([...cleanedImages, cloudinaryUrl]));

            const thumb =
              typeof product.thumbnail === "string" ? product.thumbnail : "";
            if (
              !thumb ||
              thumb.startsWith("/uploads/") ||
              thumb.startsWith("uploads/") ||
              thumb.startsWith("images/") ||
              thumb.includes("localhost:8888/uploads")
            ) {
              product.thumbnail = cloudinaryUrl;
            }

            await product.save();
          }
        } catch (err) {
          console.warn(
            "Failed to sync Product images/thumbnail after base64 upload:",
            err?.message || err
          );
        }
      }

      return {
        id: imageRecord.id,
        fileName: cloudinaryPublicId,
        filePath: cloudinaryUrl,
        url: cloudinaryUrl,
        originalName: imageRecord.originalName,
        size: uploadResult.bytes || 0,
        dimensions: { width: uploadResult.width || null, height: uploadResult.height || null },
        thumbnails: [],
        category,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Error converting base64 to file:", error);
      throw new AppError("Failed to convert base64 to file", 500);
    }
  }

  async cleanupOrphanedFiles() {
    throw new AppError(
      "Orphaned file cleanup not implemented for Cloudinary",
      501
    );
  }

  async getAllFiles() {
    throw new AppError("Get all files not implemented for Cloudinary", 501);
  }
}

module.exports = new ImageService();
