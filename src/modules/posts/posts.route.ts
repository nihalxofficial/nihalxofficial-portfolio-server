import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createPost,
  deletePost,
  listPosts,
  readPost,
  updatePost,
} from "./posts.controller";

export const postsRouter = Router();
postsRouter.use(requireAdmin);

postsRouter.get("/", listPosts);
postsRouter.post("/", createPost);
postsRouter.patch("/:id", updatePost);
postsRouter.get("/:id", readPost);
postsRouter.delete("/:id", deletePost);