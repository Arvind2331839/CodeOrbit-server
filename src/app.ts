import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler } from "./common/middleware/errorHandler.js";
import { notFound } from "./common/middleware/notFound.js";
import apiRouter from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// Static uploaded files
app.use("/uploads", express.static(path.resolve("uploads"), { dotfiles: "deny", maxAge: "1d" }));

// Swagger / OpenAPI Interactive Documentation UI
setupSwagger(app);

// Root healthcheck & info
app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "DevPrep API is running",
    documentation: "/api-docs",
  })
);

// Central API Router
app.use("/api", apiRouter);

// Central error handling
app.use(notFound);
app.use(errorHandler);

export default app;