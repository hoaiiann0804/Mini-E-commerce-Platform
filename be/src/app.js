const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const aiRoutes = require("./routes/aiRoutes"); // Import AI routes
const { errorHandler, AppError } = require("./middlewares/errorHandler");
const path = require("path");

// Initialize app
const app = express();

// Render/Reverse proxy (needed for secure cookies, correct req.ip, etc.)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Enable CORS

const parseList = (val)=> (val || "").split(",").map((s)=>s.trim()).filter(Boolean)
const defaultDevOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

const configuredOrigins = [
 ...parseList(process.env.CORS_ORIGIN),
 ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL ]: []) 
];

// Always allow local dev origins in non-production.
// This prevents accidental CORS blocks like http://localhost:5175.
if(process.env.NODE_ENV !== "production") {
  configuredOrigins.push(...defaultDevOrigins);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      process.env.NODE_ENV !== "production" &&
      defaultDevOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
};



// Handle preflight requests
app.use(cors(corsOptions))
app.options("*", cors(corsOptions));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same IP (only in production)
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 15 * 60 * 1000, // 15 minutes
    message:
      "Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 15 phút!",
  });
  app.use("/api", limiter);
}

// Body parser, reading data from body into req.body
// Skip JSON parsing for multipart/form-data requests to avoid conflicts with multer
//app.use(express.json({ limit: "50mb" }));
app.use(
  express.json({
    limit: "50mb",
    type: (req) => !req.headers["content-type"]?.startsWith("multipart/"),
  })
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against XSS
app.use(xss());

// Compression middleware
app.use(compression());

// Serve uploaded files statically (REMOVE THIS LINE WHEN USING CLOUD STORAGE LIKE CLOUDINARY)
// In production, images should be served directly from a cloud storage service (e.g., Cloudinary).
// Serve uploaded files statically (REMOVE THIS LINE WHEN USING CLOUD STORAGE LIKE CLOUDINARY)
// In production, images should be served directly from a cloud storage service (e.g., Cloudinary).
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api", routes);
app.use("/api/ai", aiRoutes); // Add AI routes

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Không tìm thấy đường dẫn: ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
