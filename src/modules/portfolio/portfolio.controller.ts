import { ApiError } from "../../utils/apiError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import {
  getFeaturedProjects,
  getPortfolioContent,
  getPostBySlug,
  getProjectBySlug,
} from "./portfolio.service";

const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

export const getPortfolio = catchAsync(async (_req, res) => {
  const content = await getPortfolioContent();

  // Allow the public site to cache aggressively; admin mutations trigger
  // revalidation on the frontend through tag based fetch options.
  res.setHeader("Cache-Control", CACHE_HEADER);

  return sendResponse(res, 200, {
    message: "Portfolio content retrieved",
    data: content,
  });
});

export const getFeatured = catchAsync(async (req, res) => {
  const limit = Math.min(12, Number(req.query.limit) || 4);
  const projects = await getFeaturedProjects(limit);

  return sendResponse(res, 200, {
    message: "Featured projects retrieved",
    data: projects,
  });
});

export const getProject = catchAsync(async (req, res) => {
  const result = await getProjectBySlug(String(req.params.slug));
  if (!result) throw ApiError.notFound("Project not found");

  res.setHeader("Cache-Control", CACHE_HEADER);

  return sendResponse(res, 200, { message: "Project retrieved", data: result });
});

export const getPost = catchAsync(async (req, res) => {
  const result = await getPostBySlug(String(req.params.slug));
  if (!result) throw ApiError.notFound("Article not found");

  res.setHeader("Cache-Control", CACHE_HEADER);

  return sendResponse(res, 200, { message: "Article retrieved", data: result });
});
