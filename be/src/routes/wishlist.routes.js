const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
// const { optionalAuthenticate } = require("../middlewares/authenticate");
const { authenticate } = require("../middlewares/authenticate");
// // All routes require authentication except check
// router.use(optionalAuthenticate);
router.use(authenticate);
// Wishlist routes
router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addToWishlist);
router.get("/check/:productId", wishlistController.checkWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);
router.delete("/", wishlistController.clearWishlist);

module.exports = router;
