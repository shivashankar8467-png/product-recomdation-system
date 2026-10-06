import { Router, type IRouter } from "express";
import {
  GetFrequentlyBoughtProductsParams,
  GetFrequentlyBoughtProductsResponse,
  GetSimilarProductsParams,
  GetSimilarProductsResponse,
  GetTrendingProductsResponse,
  GetUserRecommendationsParams,
  GetUserRecommendationsResponse,
  TrackRecommendationEventBody,
  TrackRecommendationEventResponse,
} from "@workspace/api-zod";
import { currentUser, requireAuth } from "../middlewares/auth";
import {
  getFrequentlyBoughtProducts,
  getTrendingProducts,
  getUserRecommendations,
  logRecommendationEvent,
} from "../services/recommendations";
import { getSimilarProducts } from "../services/catalog";

const router: IRouter = Router();

router.get("/recommendations/trending", async (_req, res): Promise<void> => {
  res.json(GetTrendingProductsResponse.parse(await getTrendingProducts()));
});

router.get("/recommendations/similar/:productId", async (req, res): Promise<void> => {
  const params = GetSimilarProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  res.json(GetSimilarProductsResponse.parse(await getSimilarProducts(params.data.productId)));
});

router.get("/recommendations/frequently-bought/:productId", async (req, res): Promise<void> => {
  const params = GetFrequentlyBoughtProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  res.json(GetFrequentlyBoughtProductsResponse.parse(
    await getFrequentlyBoughtProducts(params.data.productId),
  ));
});

router.get("/recommendations/user/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserRecommendationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (params.data.userId !== currentUser(req).id && currentUser(req).role !== "ADMIN") {
    res.status(403).json({ error: "You can only view recommendations for your account." });
    return;
  }
  res.json(GetUserRecommendationsResponse.parse(await getUserRecommendations(params.data.userId)));
});

router.post("/recommendations/events", requireAuth, async (req, res): Promise<void> => {
  const parsed = TrackRecommendationEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const event = await logRecommendationEvent(currentUser(req).id, parsed.data);
  res.status(201).json(TrackRecommendationEventResponse.parse(event));
});

export default router;
