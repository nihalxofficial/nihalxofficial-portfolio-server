import { Router } from "express";
import { getFeatured, getPortfolio, getPost, getProject } from "./portfolio.controller";

const router = Router();

router.get("/", getPortfolio);
router.get("/featured", getFeatured);
router.get("/projects/:slug", getProject);
router.get("/posts/:slug", getPost);

export const portfolioRouter = router;
