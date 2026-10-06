import { Router, type IRouter } from "express";
import {
  GetProductParams,
  GetProductResponse,
  ListCategoriesResponse,
  ListProductsQueryParams,
  ListProductsResponse,
} from "@workspace/api-zod";
import { optionalAuth } from "../middlewares/auth";
import { getProduct, listCategories, listProducts } from "../services/catalog";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const data = await listCategories();
  res.json(ListCategoriesResponse.parse(data));
});

router.get("/products", optionalAuth, async (req, res): Promise<void> => {
  const filters = ListProductsQueryParams.safeParse(req.query);
  if (!filters.success) {
    res.status(400).json({ error: filters.error.message });
    return;
  }
  const data = await listProducts(filters.data, req.authUser?.id);
  res.json(ListProductsResponse.parse(data));
});

router.get("/products/:productId", optionalAuth, async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const product = await getProduct(params.data.productId, req.authUser?.id);
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json(GetProductResponse.parse(product));
});

export default router;
