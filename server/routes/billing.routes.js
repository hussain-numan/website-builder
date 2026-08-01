import express from "express";
import { billing } from "../controllers/billing.controllers.js";
import isAuth from "../middlewares/isAuth.js";

const billingRouter = express.Router();

billingRouter.post("/", isAuth, billing);

export default billingRouter;
