import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import catalogRouter from "./catalog";
import customerRouter from "./customer";
import recommendationsRouter from "./recommendations";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(catalogRouter);
router.use(customerRouter);
router.use(recommendationsRouter);
router.use(adminRouter);

export default router;
