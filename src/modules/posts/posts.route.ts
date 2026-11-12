import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createPost,
  deletePost,
  listPosts,
  readPost,
  updatePost,
} from "./posts.controller";

export const postsRouter = Router();
postsRouter.use(requireAuth, requireRole("admin"));

postsRouter.get("/", listPosts);
postsRouter.post("/", createPost);
postsRouter.patch("/:id", updatePost);
postsRouter.get("/:id", readPost);
postsRouter.delete("/:id", deletePost);