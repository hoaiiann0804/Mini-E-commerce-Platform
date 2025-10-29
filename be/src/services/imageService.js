const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const Image = require('../models/image');
const { AppError } = require('../middlewares/errorHandler');

class ImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.initializeDirectories();
  }

  // Initialize upload directories
  async initializeDirectories() {
    const dirs = [
      path.join(this.uploadDir, 'images/products'),
      path.join(this.uploadDir, 'images/thumbnails'),
      path.join(this.uploadDir, 'images/users'),
      path.join(this.uploadDir, 'images/reviews'),
      path.join(this.uploadDir, 'images/temp'),
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
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Use forward slashes for URL compatibility
    return path.join('images', category, year.toString(), month, fileName).replace(/\\/g, '/');
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
      console.error('Error getting image dimensions:', error);
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
          fit: options.fit || 'inside',
          withoutEnlargement: true,
        });
      }

      // Apply quality settings
      if (options.quality) {
        if (outputPath.endsWith('.jpg') || outputPath.endsWith('.jpeg')) {
          sharpInstance = sharpInstance.jpeg({ quality: options.quality });
        } else if (outputPath.endsWith('.png')) {
          sharpInstance = sharpInstance.png({ quality: options.quality });
        } else if (outputPath.endsWith('.webp')) {
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
      console.error('Error processing image:', error);
      throw new AppError('Failed to process image', 500);
    }
  }

  // Generate thumbnails
  async generateThumbnails(originalPath, fileName, category) {
    const thumbnails = [];
    const thumbSizes = [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 600, height: 600 },
    ];

    for (const size of thumbSizes) {
      try {
        const thumbFileName = `${path.parse(fileName).name}_${size.name}${path.extname(fileName)}`;
        const thumbPath = this.generateFilePath('thumbnails', thumbFileName);
        const fullThumbPath = path.join(this.uploadDir, thumbPath);

        await this.processImage(originalPath, fullThumbPath, {
          width: size.width,
          height: size.height,
          quality: 85,
          fit: 'cover',
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
      console.log('📤 Starting image upload:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        options,
      });

      const {
        category = 'product',
        productId = null,
        userId = null,
        generateThumbs = true,
        optimize = true,
      } = options;

      // Generate unique filename
      const fileName = this.generateUniqueFileName(file.originalname);
      const filePath = this.generateFilePath(category, fileName);
      const fullPath = path.join(this.uploadDir, filePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Process and save image
      if (optimize) {
        await this.processImage(file.path, fullPath, {
          quality: 90,
        });
      } else {
        // Just move the file
        await fs.copyFile(file.path, fullPath);
      }

      // Get image dimensions
      const dimensions = await this.getImageDimensions(fullPath);

      // Save to database
      const imageRecord = await Image.create({
        originalName: file.originalname,
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        width: dimensions.width,
        height: dimensions.height,
        category: category,
        productId: productId,
        userId: userId,
      });

      // Generate thumbnails if requested
      let thumbnails = [];
      if (generateThumbs && category === 'product') {
        thumbnails = await this.generateThumbnails(
          fullPath,
          fileName,
          category
        );
      }

      // Clean up temp file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }

      return {
        id: imageRecord.id,
        fileName: fileName,
        filePath: filePath,
        url: `/uploads/${filePath}`,
        originalName: file.originalname,
        size: file.size,
        dimensions,
        thumbnails,
        category,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new AppError('Failed to upload image', 500);
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
        throw new AppError('Image not found', 404);
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
      const fullPath = path.join(this.uploadDir, image.filePath);

      // Delete file from filesystem
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }

      // Delete thumbnails if they exist
      if (image.category === 'product') {
        const thumbSizes = ['small', 'medium', 'large'];
        for (const size of thumbSizes) {
          try {
            const thumbFileName = `${path.parse(image.fileName).name}_${size}${path.extname(image.fileName)}`;
            const thumbPath = path.join(
              this.uploadDir,
              'images/thumbnails',
              thumbFileName
            );
            await fs.unlink(thumbPath);
          } catch (error) {
            // Ignore thumbnail deletion errors
          }
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
        order: [['createdAt', 'ASC']],
      });
      return images;
    } catch (error) {
      throw error;
    }
  }

  // Convert base64 to file
  async convertBase64ToFile(base64Data, options = {}) {
    try {
      const { category = 'product', productId = null, userId = null } = options;

      // Extract mime type and base64 data
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new AppError('Invalid base64 data', 400);
      }

      const mimeType = matches[1];
      const base64 = matches[2];

      // Determine file extension
      const ext = mimeType.split('/')[1];
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = this.generateFilePath(category, fileName);
      const fullPath = path.join(this.uploadDir, filePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Convert and save
      const buffer = Buffer.from(base64, 'base64');
      await fs.writeFile(fullPath, buffer);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(fullPath);

      // Save to database
      const imageRecord = await Image.create({
        originalName: `converted_${fileName}`,
        fileName: fileName,
        filePath: filePath,
        fileSize: buffer.length,
        mimeType: mimeType,
        width: dimensions.width,
        height: dimensions.height,
        category: category,
        productId: productId,
        userId: userId,
      });

      return {
        id: imageRecord.id,
        fileName: fileName,
        filePath: filePath,
        url: `/uploads/${filePath}`,
        originalName: `converted_${fileName}`,
        size: buffer.length,
        dimensions,
        category,
      };
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      throw new AppError('Failed to convert base64 to file', 500);
    }
  }

  // Cleanup orphaned files
  async cleanupOrphanedFiles() {
    try {
      // Get all files in upload directory
      const allFiles = await this.getAllFiles(this.uploadDir);

      // Get all active images from database
      const activeImages = await Image.findAll({
        where: { isActive: true },
        attributes: ['filePath'],
      });

      const activeFilePaths = new Set(activeImages.map((img) => img.filePath));

      // Find orphaned files
      const orphanedFiles = allFiles.filter((filePath) => {
        const relativePath = path.relative(this.uploadDir, filePath);
        return !activeFilePaths.has(relativePath);
      });

      // Delete orphaned files
      for (const filePath of orphanedFiles) {
        try {
          await fs.unlink(filePath);
          console.log(`Deleted orphaned file: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting orphaned file ${filePath}:`, error);
        }
      }

      return {
        totalFiles: allFiles.length,
        activeFiles: activeImages.length,
        orphanedFiles: orphanedFiles.length,
        deletedFiles: orphanedFiles.length,
      };
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      throw new AppError('Failed to cleanup orphaned files', 500);
    }
  }

  // Helper method to get all files recursively
  async getAllFiles(dirPath) {
    const files = [];
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}

module.exports = new ImageService();
