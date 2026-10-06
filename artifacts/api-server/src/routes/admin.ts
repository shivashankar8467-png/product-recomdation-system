import { Router, type IRouter } from "express";
import {
  CreateAdminCategoryBody,
  CreateAdminCategoryResponse,
  CreateAdminProductBody,
  CreateAdminProductResponse,
  DeleteAdminCategoryParams,
  DeleteAdminProductParams,
  DeleteAdminReviewParams,
  GetAdminDashboardResponse,
  GetRecommendationAnalyticsResponse,
  ListAdminCustomersResponse,
  ListAdminOrdersResponse,
  ListAdminReviewsResponse,
  UpdateAdminCategoryBody,
  UpdateAdminCategoryParams,
  UpdateAdminCategoryResponse,
  UpdateAdminOrderBody,
  UpdateAdminOrderParams,
  UpdateAdminOrderResponse,
  UpdateAdminProductBody,
  UpdateAdminProductParams,
  UpdateAdminProductResponse,
} from "@workspace/api-zod";
import { Router as ExpressRouter } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middlewares/auth";
import {
  createCategory,
  dashboard,
  deleteAdminReview,
  deleteCategory,
  listAdminOrders,
  listAdminReviews,
  listCustomers,
  updateCategory,
  updateOrder,
} from "../services/admin";
import { createProduct, updateProduct } from "../services/catalog";
import { recommendationAnalytics } from "../services/recommendations";

const router: IRouter = ExpressRouter();
router.use("/admin", requireAdmin);

router.get("/admin/dashboard", async (_req, res): Promise<void> => {
  res.json(GetAdminDashboardResponse.parse(await dashboard()));
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = CreateAdminProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const product = await createProduct(parsed.data);
  res.status(201).json(CreateAdminProductResponse.parse(product));
});

router.patch("/admin/products/:productId", async (req, res): Promise<void> => {
  const params = UpdateAdminProductParams.safeParse(req.params);
  const body = UpdateAdminProductBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const product = await updateProduct(params.data.productId, body.data);
  res.json(UpdateAdminProductResponse.parse(product));
});

router.delete("/admin/products/:productId", async (req, res): Promise<void> => {
  const params = DeleteAdminProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted = await prisma.product.deleteMany({ where: { id: params.data.productId } });
  if (!deleted.count) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.sendStatus(204);
});

router.get("/admin/orders", async (_req, res): Promise<void> => {
  res.json(ListAdminOrdersResponse.parse(await listAdminOrders()));
});

router.patch("/admin/orders/:orderId", async (req, res): Promise<void> => {
  const params = UpdateAdminOrderParams.safeParse(req.params);
  const body = UpdateAdminOrderBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const order = await updateOrder(params.data.orderId, body.data.status);
  res.json(UpdateAdminOrderResponse.parse(order));
});

router.post("/admin/categories", async (req, res): Promise<void> => {
  const parsed = CreateAdminCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const category = await createCategory(parsed.data);
  res.status(201).json(CreateAdminCategoryResponse.parse(category));
});

router.patch("/admin/categories/:categoryId", async (req, res): Promise<void> => {
  const params = UpdateAdminCategoryParams.safeParse(req.params);
  const body = UpdateAdminCategoryBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const category = await updateCategory(params.data.categoryId, body.data);
  res.json(UpdateAdminCategoryResponse.parse(category));
});

router.delete("/admin/categories/:categoryId", async (req, res): Promise<void> => {
  const params = DeleteAdminCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted = await deleteCategory(params.data.categoryId);
  if (!deleted) {
    res.status(404).json({ error: "Category not found." });
    return;
  }
  res.sendStatus(204);
});

router.get("/admin/customers", async (_req, res): Promise<void> => {
  res.json(ListAdminCustomersResponse.parse(await listCustomers()));
});

router.get("/admin/reviews", async (_req, res): Promise<void> => {
  res.json(ListAdminReviewsResponse.parse(await listAdminReviews()));
});

router.delete("/admin/reviews/:reviewId", async (req, res): Promise<void> => {
  const params = DeleteAdminReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await deleteAdminReview(params.data.reviewId))) {
    res.status(404).json({ error: "Review not found." });
    return;
  }
  res.sendStatus(204);
});

router.get("/admin/recommendation-analytics", async (_req, res): Promise<void> => {
  res.json(GetRecommendationAnalyticsResponse.parse(await recommendationAnalytics()));
});

export default router;
