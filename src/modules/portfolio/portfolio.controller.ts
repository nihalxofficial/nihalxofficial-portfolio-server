import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { getFeaturedProjects, getPortfolioContent } from "./portfolio.service";

export const getPortfolio = catchAsync(async (_req, res) => {
  const content = await getPortfolioContent();

  // Allow the public site to cache aggressively; admin mutations trigger
  // revalidation on the frontend through tag based fetch options.
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

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
