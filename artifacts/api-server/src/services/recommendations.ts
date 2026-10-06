import { BehaviorType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { toProduct } from "./common";
import { getSimilarProducts } from "./catalog";

const behaviorWeights: Partial<Record<BehaviorType, number>> = {
  VIEW: 1,
  CLICK: 2,
  WISHLIST: 4,
  ADD_TO_CART: 6,
  RATING: 8,
  PURCHASE: 10,
};

type ProductInterest = {
  productId: string;
  categoryId: string;
  brand: string;
  price: number;
  attributes: Record<string, string>;
  weight: number;
};

export async function getUserRecommendations(userId: string, take = 12) {
  const [events, products, cart, saved] = await Promise.all([
    prisma.behaviorEvent.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      include: { product: { select: { id: true, categoryId: true, brand: true, price: true, attributes: true } } },
      orderBy: { createdAt: "desc" },
      take: 400,
    }),
    prisma.product.findMany({
      where: { inventory: { gt: 0 } },
      include: { category: true },
      take: 250,
    }),
    prisma.cart.findUnique({
      where: { userId },
      include: { items: { select: { productId: true } } },
    }),
    prisma.wishlist.findMany({ where: { userId }, select: { productId: true } }),
  ]);
  const weightByProduct = new Map<string, number>();
  const categoryScores = new Map<string, number>();
  const brandScores = new Map<string, number>();
  const seenPurchased = new Set<string>();
  const interests: ProductInterest[] = [];
  const now = Date.now();
  for (const event of events) {
    const base = behaviorWeights[event.type] ?? 0;
    const ageDays = (now - event.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const recency = Math.max(0.2, 1 - ageDays / 120);
    const score = base * recency;
    if (event.product) {
      const product = event.product;
      weightByProduct.set(product.id, (weightByProduct.get(product.id) ?? 0) + score);
      categoryScores.set(product.categoryId, (categoryScores.get(product.categoryId) ?? 0) + score);
      brandScores.set(product.brand, (brandScores.get(product.brand) ?? 0) + score);
      interests.push({
        productId: product.id,
        categoryId: product.categoryId,
        brand: product.brand,
        price: product.price,
        attributes: product.attributes as Record<string, string>,
        weight: Math.max(1, score),
      });
      if (event.type === BehaviorType.PURCHASE) seenPurchased.add(product.id);
    }
    if (event.type === BehaviorType.CATEGORY_VISIT && event.categoryId) {
      categoryScores.set(event.categoryId, (categoryScores.get(event.categoryId) ?? 0) + 1.5 * recency);
    }
  }
  const excluded = new Set([
    ...seenPurchased,
    ...(cart?.items.map((item) => item.productId) ?? []),
    ...saved.map((item) => item.productId),
  ]);
  const collaborative = await collaborativeScores(userId, new Set(weightByProduct.keys()));
  const candidates = products
    .filter((product) => !excluded.has(product.id))
    .map((product) => {
      const categorySimilarity = categoryScores.get(product.categoryId) ?? 0;
      const brandSimilarity = brandScores.get(product.brand) ?? 0;
      let productSimilarity = 0;
      for (const interest of interests) {
        if (interest.productId === product.id) continue;
        const priceSimilarity =
          Math.min(product.price, interest.price) / Math.max(product.price, interest.price);
        const sharedAttributes = Object.entries(interest.attributes).filter(
          ([key, value]) => product.attributes && (product.attributes as Record<string, string>)[key] === value,
        ).length;
        const itemScore =
          (product.categoryId === interest.categoryId ? 1.8 : 0) +
          (product.brand === interest.brand ? 1.15 : 0) +
          priceSimilarity * 0.8 +
          Math.min(sharedAttributes, 3) * 0.3;
        productSimilarity += itemScore * interest.weight * 0.18;
      }
      const behaviorScore =
        collaborative.get(product.id) ?? weightByProduct.get(product.id) ?? 0;
      const popularity =
        Math.log1p(product.soldCount) * 1.2 +
        (product.featured ? 1.5 : 0);
      const rating = product.rating * Math.min(1.2, 0.25 + product.reviewCount / 30);
      const score =
        behaviorScore +
        categorySimilarity * 0.9 +
        brandSimilarity * 0.35 +
        productSimilarity +
        popularity +
        rating;
      const reason =
        collaborative.has(product.id)
          ? "Popular with customers like you"
          : categorySimilarity > 0
            ? "Based on your recent interests"
            : "Trending with customers";
      return { product, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  const savedRecommendations = await Promise.all(
    candidates.map(async (item) => {
      const recommendation = await prisma.recommendation.upsert({
        where: { userId_productId: { userId, productId: item.product.id } },
        create: {
          userId,
          productId: item.product.id,
          score: item.score,
          reason: item.reason,
          algorithm: "HYBRID",
        },
        update: { score: item.score, reason: item.reason, algorithm: "HYBRID" },
        select: { id: true },
      });
      return {
        product: toProduct(item.product),
        score: Number(item.score.toFixed(3)),
        reason: item.reason,
        recommendationId: recommendation.id,
      };
    }),
  );
  return savedRecommendations;
}

async function collaborativeScores(userId: string, productIds: Set<string>) {
  if (productIds.size === 0) return new Map<string, number>();
  const otherEvents = await prisma.behaviorEvent.findMany({
    where: {
      userId: { not: userId },
      productId: { not: null },
      type: { in: [BehaviorType.WISHLIST, BehaviorType.ADD_TO_CART, BehaviorType.PURCHASE, BehaviorType.RATING] },
      createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
    },
    select: { userId: true, productId: true, type: true },
    take: 4000,
  });
  const userWeights = new Map<string, number>();
  for (const event of otherEvents) {
    if (!event.productId || !event.userId) continue;
    const weight = behaviorWeights[event.type] ?? 0;
    const current = userWeights.get(`${event.userId}|${event.productId}`) ?? 0;
    userWeights.set(`${event.userId}|${event.productId}`, current + weight);
  }
  const overlapByUser = new Map<string, number>();
  const candidateByUser = new Map<string, Array<{ productId: string; weight: number }>>();
  for (const [key, weight] of userWeights.entries()) {
    const separator = key.indexOf("|");
    const otherUserId = key.slice(0, separator);
    const productId = key.slice(separator + 1);
    if (productIds.has(productId)) {
      overlapByUser.set(otherUserId, (overlapByUser.get(otherUserId) ?? 0) + Math.min(10, weight));
    } else {
      const values = candidateByUser.get(otherUserId) ?? [];
      values.push({ productId, weight });
      candidateByUser.set(otherUserId, values);
    }
  }
  const result = new Map<string, number>();
  const neighbors = [...overlapByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  for (const [neighborId, similarity] of neighbors) {
    const normalization = Math.max(1, Math.sqrt(similarity));
    for (const candidate of candidateByUser.get(neighborId) ?? []) {
      result.set(
        candidate.productId,
        (result.get(candidate.productId) ?? 0) + (similarity / normalization) * Math.log1p(candidate.weight),
      );
    }
  }
  return result;
}

export async function getTrendingProducts(take = 12) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [products, events] = await Promise.all([
    prisma.product.findMany({
      where: { inventory: { gt: 0 } },
      include: { category: true },
      take: 200,
    }),
    prisma.behaviorEvent.groupBy({
      by: ["productId", "type"],
      where: {
        productId: { not: null },
        createdAt: { gte: since },
      },
      _count: { _all: true },
    }),
  ]);
  const weights = new Map<string, number>();
  for (const event of events) {
    if (!event.productId) continue;
    const weight = behaviorWeights[event.type] ?? (event.type === BehaviorType.SEARCH ? 0.5 : 0);
    weights.set(event.productId, (weights.get(event.productId) ?? 0) + event._count._all * weight);
  }
  return products
    .map((product) => ({
      product: toProduct(product),
      score:
        (weights.get(product.id) ?? 0) +
        Math.log1p(product.soldCount) * 2 +
        product.rating * 1.4,
      reason: "Trending this week",
      recommendationId: null,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, take);
}

export async function getFrequentlyBoughtProducts(productId: string, take = 8) {
  const base = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    select: { id: true },
  });
  if (!base) return [];
  const baskets = await prisma.orderItem.findMany({
    where: { productId: base.id },
    select: { orderId: true },
    take: 1000,
  });
  const orderIds = [...new Set(baskets.map((item) => item.orderId))];
  if (!orderIds.length) return getSimilarProducts(base.id, take);
  const companions = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { orderId: { in: orderIds }, productId: { not: base.id } },
    _count: { _all: true },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take,
  });
  const productIds = companions.flatMap((item) => item.productId ? [item.productId] : []);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  return companions.flatMap((companion) => {
    if (!companion.productId) return [];
    const product = productMap.get(companion.productId);
    if (!product) return [];
    return [{
      product: toProduct(product),
      score: companion._sum.quantity ?? companion._count._all,
      reason: "Frequently bought with this product",
      recommendationId: null,
    }];
  });
}

export async function logRecommendationEvent(
  userId: string,
  input: { recommendationId: string; productId: string; type: "IMPRESSION" | "CLICK" | "ADD_TO_CART" | "PURCHASE" },
) {
  const recommendation = await prisma.recommendation.findFirst({
    where: { id: input.recommendationId, userId, productId: input.productId },
    select: { id: true },
  });
  const event = await prisma.recommendationEvent.create({
    data: {
      userId,
      recommendationId: recommendation?.id,
      productId: input.productId,
      type: input.type,
    },
  });
  return { id: event.id, type: event.type, createdAt: event.createdAt.toISOString() };
}

export async function recommendationAnalytics() {
  const events = await prisma.recommendationEvent.findMany({
    select: { type: true, revenue: true },
  });
  const impressions = events.filter((event) => event.type === "IMPRESSION").length;
  const clicks = events.filter((event) => event.type === "CLICK").length;
  const conversions = events.filter((event) => event.type === "PURCHASE").length;
  return {
    impressions,
    clicks,
    ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(1)) : 0,
    conversions,
    conversionRate: impressions ? Number(((conversions / impressions) * 100).toFixed(1)) : 0,
    attributedRevenue: Number(
      events.reduce((sum, event) => sum + event.revenue, 0).toFixed(2),
    ),
  };
}
