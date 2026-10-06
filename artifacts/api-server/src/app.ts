import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { optionalAuth } from "./middlewares/auth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true }));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", optionalAuth, router);

app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    const status =
      error && typeof error === "object" && "status" in error && typeof error.status === "number"
        ? error.status
        : error && typeof error === "object" && "code" in error && error.code === "P2002"
          ? 409
          : 500;
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    if (status >= 500) {
      req.log.error({ errorName: error instanceof Error ? error.name : "UnknownError" }, "Request failed");
    }
    res.status(status).json({
      error: status >= 500 ? "Something went wrong. Please try again." : message,
    });
  },
);

export default app;
