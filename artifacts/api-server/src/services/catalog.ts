import { BehaviorType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { toProduct, toReview } from "./common";

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    productCount: category._count.products,
  }));
}

export async function listProducts(filters: ProductFilters, userId?: string) {
  const where: Prisma.ProductWhereInput = {
    ...(filters.category
      ? {
          category: {
            OR: [{ id: filters.category }, { slug: filters.category }],
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { brand: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { category: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "newest"
      ? { createdAt: "desc" }
      : filters.sort === "price-asc"
        ? { price: "asc" }
        : filters.sort === "price-desc"
          ? { price: "desc" }
          : filters.sort === "rating"
            ? { rating: "desc" }
            : filters.sort === "popular"
              ? { soldCount: "desc" }
              : { featured: "desc" };
  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: [orderBy, { createdAt: "desc" }],
    take: 100,
  });
  if (userId && filters.q?.trim()) {
    await prisma.behaviorEvent.create({
      data: {
        userId,
        type: BehaviorType.SEARCH,
        searchQuery: filters.q.trim().slice(0, 250),
      },
    });
  }
  if (userId && filters.category) {
    const category = await prisma.category.findFirst({
      where: { OR: [{ id: filters.category }, { slug: filters.category }] },
      select: { id: true },
    });
    if (category) {
      await prisma.behaviorEvent.create({
        data: { userId, type: BehaviorType.CATEGORY_VISIT, categoryId: category.id },
      });
    }
  }
  return products.map(toProduct);
}

export async function getProduct(productId: string, userId?: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    include: { category: true },
  });
  if (!product) return null;
  const [reviews, similar] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getSimilarProducts(product.id, 4),
  ]);
  if (userId) {
    await prisma.behaviorEvent.create({
      data: { userId, productId: product.id, type: BehaviorType.VIEW },
    });
  }
  return {
    ...toProduct(product),
    reviews: reviews.map(toReview),
    similar,
  };
}

export async function createProduct(input: {
  name: string;
  description: string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  categoryId: string;
  image: string;
  images?: string[];
  inventory: number;
  featured?: boolean;
  attributes?: Record<string, string>;
}) {
  const slug = await uniqueProductSlug(input.name);
  const product = await prisma.product.create({
    data: {
      ...input,
      slug,
      description: input.description.trim(),
      attributes: input.attributes ?? {},
    },
    include: { category: true },
  });
  return toProduct(product);
}

export async function updateProduct(
  productId: string,
  input: Partial<{
    name: string;
    description: string;
    brand: string;
    price: number;
    compareAtPrice: number | null;
    categoryId: string;
    image: string;
    images: string[];
    inventory: number;
    featured: boolean;
    attributes: Record<string, string>;
  }>,
) {
  const data: Prisma.ProductUpdateInput = {
    ...input,
    ...(input.name ? { name: input.name, slug: await uniqueProductSlug(input.name, productId) } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
  };
  const product = await prisma.product.update({
    where: { id: productId },
    data,
    include: { category: true },
  });
  return toProduct(product);
}

async function uniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const base = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = base || "product";
  let suffix = 2;
  while (await prisma.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } })) {
    slug = `${base || "product"}-${suffix++}`;
  }
  return slug;
}

export async function getSimilarProducts(productId: string, take = 8) {
  const base = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });
  if (!base) return [];
  const products = await prisma.product.findMany({
    where: { id: { not: base.id }, inventory: { gt: 0 } },
    include: { category: true },
    take: 100,
  });
  const baseAttrs = base.attributes as Record<string, string>;
  return products
    .map((product) => {
      const attrs = product.attributes as Record<string, string>;
      const shared = Object.entries(baseAttrs).filter(([key, value]) => attrs[key] === value).length;
      const categoryScore = product.categoryId === base.categoryId ? 35 : 0;
      const brandScore = product.brand === base.brand ? 18 : 0;
      const priceRatio = Math.min(product.price, base.price) / Math.max(product.price, base.price);
      const priceScore = Math.round(priceRatio * 16);
      const attributeScore = Math.min(20, shared * 7);
      const ratingScore = product.rating * 2;
      const score = categoryScore + brandScore + priceScore + attributeScore + ratingScore;
      const reason =
        product.categoryId === base.categoryId
          ? "Similar style and category"
          : product.brand === base.brand
            ? `More from ${base.brand}`
            : "Picked for a similar price and style";
      return { product: toProduct(product), score, reason, recommendationId: null as string | null };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take);
}
