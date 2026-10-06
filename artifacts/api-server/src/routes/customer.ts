import { Router, type IRouter } from "express";
import {
  AddCartItemBody,
  AddWishlistItemParams,
  CreateOrderBody,
  CreateOrderResponse,
  CreateProductReviewBody,
  CreateProductReviewParams,
  CreateProductReviewResponse,
  GetCartResponse,
  GetOrderParams,
  GetOrderResponse,
  GetWishlistResponse,
  ListOrdersResponse,
  ListProductReviewsParams,
  ListProductReviewsResponse,
  RemoveCartItemParams,
  RemoveWishlistItemParams,
  TrackBehaviorEventBody,
  TrackBehaviorEventResponse,
  UpdateCartItemBody,
  UpdateCartItemParams,
} from "@workspace/api-zod";
import { currentUser, requireAuth } from "../middlewares/auth";
import {
  addCartItem,
  addWishlistItem,
  createOrder,
  createProductReview,
  getCart,
  getOrder,
  getWishlist,
  listOrders,
  listProductReviews,
  removeCartItem,
  removeWishlistItem,
  trackBehavior,
  updateCartItem,
} from "../services/customer";

const router: IRouter = Router();

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  res.json(GetCartResponse.parse(await getCart(currentUser(req).id)));
});

router.post("/cart/items", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(GetCartResponse.parse(await addCartItem(
    currentUser(req).id,
    parsed.data.productId,
    parsed.data.quantity,
  )));
});

router.patch("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  const body = UpdateCartItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  res.json(GetCartResponse.parse(await updateCartItem(
    currentUser(req).id,
    params.data.productId,
    body.data.quantity,
  )));
});

router.delete("/cart/items/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  res.json(GetCartResponse.parse(await removeCartItem(currentUser(req).id, params.data.productId)));
});

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  res.json(GetWishlistResponse.parse(await getWishlist(currentUser(req).id)));
});

router.put("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = AddWishlistItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await addWishlistItem(currentUser(req).id, params.data.productId);
  res.sendStatus(204);
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveWishlistItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await removeWishlistItem(currentUser(req).id, params.data.productId);
  res.sendStatus(204);
});

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  res.json(ListOrdersResponse.parse(await listOrders(currentUser(req).id)));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const order = await createOrder(currentUser(req).id, parsed.data);
  res.status(201).json(CreateOrderResponse.parse(order));
});

router.get("/orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const order = await getOrder(currentUser(req).id, params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  res.json(GetOrderResponse.parse(order));
});

router.get("/products/:productId/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const reviews = await listProductReviews(params.data.productId);
  if (!reviews) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json(ListProductReviewsResponse.parse(reviews));
});

router.post("/products/:productId/reviews", requireAuth, async (req, res): Promise<void> => {
  const params = CreateProductReviewParams.safeParse(req.params);
  const body = CreateProductReviewBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const review = await createProductReview(currentUser(req).id, params.data.productId, body.data);
  res.status(201).json(CreateProductReviewResponse.parse(review));
});

router.post("/behavior/events", requireAuth, async (req, res): Promise<void> => {
  const parsed = TrackBehaviorEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const event = await trackBehavior(currentUser(req).id, parsed.data);
  res.status(201).json(TrackBehaviorEventResponse.parse(event));
});

export default router;
