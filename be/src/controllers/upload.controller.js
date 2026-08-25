const multer = require("multer");
const cloudinary = require("cloudinary").v2; // Import Cloudinary SDK (only for deletion)
const { AppError } = require("../middlewares/errorHandler");
const uploadCloudinary = require("../middlewares/cloudinaryUploadMiddleware"); // Use the Cloudinary Multer instance

// No need for local uploadDirs or multer.diskStorage configuration here.
// All configuration is handled by cloudinaryUploadMiddleware.js

// Upload single file
const uploadSingle = async (req, res, next) => {
  try {
    // Use the pre-configured uploadCloudinary middleware
    const uploadMiddleware = uploadCloudinary.single("file"); // 'file' is the field name for single upload

    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new AppError(
                `File quá lớn. Kích thước tối đa ${process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024) : 5}MB`,
                400
              )
            );
          }
          return next(new AppError(`Lỗi upload: ${err.message}`, 400));
        }
        return next(err);
      }

      if (!req.file) {
        return next(new AppError("Không có file được upload", 400));
      }

      // req.file will contain Cloudinary response data
      // req.file.path is the Cloudinary URL
      // req.file.filename is the Cloudinary public_id
      const fileUrl = req.file.path;
      const filename = req.file.filename; // Cloudinary public_id
      const uploadType = req.body.category || "general"; // Use category from body or default

      res.status(200).json({
        status: "success",
        message: "Upload file thành công",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: fileUrl,
          size: req.file.size,
          type: uploadType,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

// Upload multiple files
const uploadMultiple = async (req, res, next) => {
  try {
    const uploadType = req.params.type || "general";
    const maxFiles = uploadType === "reviews" ? 5 : 10; // This limit should ideally be set in cloudinaryUploadMiddleware, but for now we follow old logic

    // Use the pre-configured uploadCloudinary middleware for multiple files
    const uploadMiddleware = uploadCloudinary.array("files", maxFiles); // 'files' is the field name

    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new AppError(
                `File quá lớn. Kích thước tối đa ${process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024) : 5}MB`,
                400
              )
            );
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return next(
              new AppError(`Số lượng file tối đa là ${maxFiles}`, 400)
            );
          }
          return next(new AppError(`Lỗi upload: ${err.message}`, 400));
        }
        return next(err);
      }

      if (!req.files || req.files.length === 0) {
        return next(new AppError("Không có file được upload", 400));
      }

      // Generate URLs for uploaded files
      const files = req.files.map((file) => ({
        filename: file.filename, // Cloudinary public_id
        originalName: file.originalname,
        url: file.path, // Cloudinary URL
        size: file.size,
      }));

      res.status(200).json({
        status: "success",
        message: `Upload ${files.length} file thành công`,
        data: {
          files,
          type: uploadType,
          count: files.length,
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

// Delete uploaded file
const deleteFile = async (req, res, next) => {
  try {
    const { publicId } = req.params; // Expecting Cloudinary public_id

    if (!publicId) {
      throw new AppError("Không tìm thấy public ID của file", 400);
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    //console.log("Cloudinary deletion result:", result);

    if (result.result !== "ok") {
      throw new AppError(
        `Không thể xóa file từ Cloudinary: ${result.result}`,
        500
      );
    }

    res.status(200).json({
      status: "success",
      message: "Xóa file thành công",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile, // No longer exporting the local multer instance
};
