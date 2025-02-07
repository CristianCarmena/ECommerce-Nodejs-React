import express from "express";

import { getCoupon, validateCoupon } from "../controllers/coupon.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getCoupon);
router.get("/validate", protectRoute, adminRoute, validateCoupon);

export default router;