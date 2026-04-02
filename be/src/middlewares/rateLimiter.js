const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});

// Auth endpoints rate limiter (more strict)
const authLimiter = rateLimit({
  // windowMs: 60 * 60 * 1000, // 1 hour
  windowMs: 15*60*1000, //15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=>`${req.ip}-${req.body.email}`,
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: "Too many login attempts, please try again later.",
  },
});

const orderLimter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    status: "fail",
    message: "Too many login attempts, please try again later",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  orderLimter,
};
