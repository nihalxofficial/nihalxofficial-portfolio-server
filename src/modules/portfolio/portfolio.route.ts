import { Router } from "express";
import { getFeatured, getPortfolio } from "./portfolio.controller";

const router = Router();

router.get("/", getPortfolio);
router.get("/featured", getFeatured);

export const portfolioRouter = router;
