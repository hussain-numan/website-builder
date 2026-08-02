import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import websiteRouter from "./routes/website.routes.js";
import billingRouter from "./routes/billing.routes.js";
import { stripeWebhook } from "./controllers/stripeWebhook.controllers.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION");
  console.error(err);
});

const app = express();

const port = process.env.PORT || 8000;

// Hostinger (and most shared hosts) sit behind a reverse proxy.
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://websitebuilder.softvixsolution.com",
  "http://localhost:5173",
  "http://localhost:5177",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("CORS Error: origin not allowed"));
    },
    credentials: true,
  })
);

// Stripe needs the raw request body to verify webhook signatures, so this
// route must be registered before the global express.json() parser below.
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Website Builder API is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/website", websiteRouter);
app.use("/api/billing", billingRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  if (err.message?.startsWith("CORS Error")) {
    return res.status(403).json({
      success: false,
      message: "This origin is not allowed to access the API",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

connectDb();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});