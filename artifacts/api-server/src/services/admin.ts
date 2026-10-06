import { BehaviorType, OrderStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asIso, slugify, toOrder, toProduct, toReview } from "./common";
import { recommendationAnalytics } from "./recommendations";

export async function dashboard() {
  const [users, products, orders, totals, allOrders, topProducts, categories, activity, recommendationMetrics] =
    await Promise.all([
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
        _avg: { total: true },
      }),
      prisma.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.product.findMany({
        include: { category: true },
        orderBy: [{ soldCount: "desc" }, { rating: "desc" }],
        take: 5,
      }),
      prisma.category.findMany({
        include: { products: { select: { soldCount: true, price: true } } },
      }),
      prisma.behaviorEvent.findMany({
        include: {
          user: { select: { name: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      recommendationAnalytics(),
    ]);
  const daily = new Map<string, { revenue: number; orders: number }>();
  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - daysAgo);
    const key = day.toISOString().slice(0, 10);
    daily.set(key, { revenue: 0, orders: 0 });
  }
  for (const order of allOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const point = daily.get(key);
    if (point) {
      point.revenue += order.total;
      point.orders += 1;
    }
  }
  const categoryRevenue = new Map<string, { revenue: number; unitsSold: number }>();
  for (const category of categories) {
    categoryRevenue.set(category.name, { revenue: 0, unitsSold: 0 });
    for (const product of category.products) {
      const current = categoryRevenue.get(category.name)!;
      current.unitsSold += product.soldCount;
      current.revenue += product.soldCount * product.price;
    }
  }
  const recentActivity = activity.map((event) => {
    const target = event.product?.name ? ` — ${event.product.name}` : "";
    const actor = event.user.name;
    return `${actor} ${activityVerb(event.type)}${target}`;
  });
  const completeTopProducts = await Promise.all(
    topProducts.map(async (product) => ({
      product: toProduct(product),
      unitsSold: product.soldCount,
      revenue: Number((product.soldCount * product.price).toFixed(2)),
    })),
  );
  return {
    users,
    products,
    orders,
    revenue: Number((totals._sum.total ?? 0).toFixed(2)),
    averageOrderValue: Number((totals._avg.total ?? 0).toFixed(2)),
    sales: [...daily.entries()].map(([date, values]) => ({
      date,
      revenue: Number(values.revenue.toFixed(2)),
      orders: values.orders,
    })),
    topProducts: completeTopProducts,
    topCategories: [...categoryRevenue.entries()]
      .map(([category, values]) => ({
        category,
        revenue: Number(values.revenue.toFixed(2)),
        unitsSold: values.unitsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    recentActivity,
    recommendationMetrics,
  };
}

function activityVerb(type: BehaviorType): string {
  const verbs: Record<BehaviorType, string> = {
    VIEW: "viewed",
    CLICK: "clicked",
    SEARCH: "searched the catalog",
    CATEGORY_VISIT: "explored a category",
    WISHLIST: "saved to their wishlist",
    ADD_TO_CART: "added to cart",
    REMOVE_FROM_CART: "removed from cart",
    PURCHASE: "purchased",
    RATING: "reviewed",
    PAGE_TIME: "spent time viewing",
  };
  return verbs[type];
}

export async function listAdminOrders() {
  const orders = await prisma.order.findMany({
    include: { user: { select: { name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  return orders.map(toOrder);
}

export async function updateOrder(orderId: string, status: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
    include: { user: { select: { name: true, email: true } }, items: true },
  });
  return toOrder(order);
}

export async function listCustomers() {
  const users = await prisma.user.findMany({
    where: { role: UserRole.CUSTOMER },
    include: {
      orders: { where: { status: { not: OrderStatus.CANCELLED } }, select: { total: true } },
      behaviorEvents: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    orderCount: user.orders.length,
    totalSpent: Number(user.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)),
    lastActiveAt: user.behaviorEvents[0] ? asIso(user.behaviorEvents[0].createdAt) : null,
  }));
}

export async function listAdminReviews() {
  const reviews = await prisma.review.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  return reviews.map(toReview);
}

export async function deleteAdminReview(reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { productId: true } });
  if (!review) return false;
  await prisma.$transaction([
    prisma.review.delete({ where: { id: reviewId } }),
    prisma.product.update({
      where: { id: review.productId },
      data: {
        reviewCount: { decrement: 1 },
      },
    }),
  ]);
  const aggregate = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: { rating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count._all },
  });
  return true;
}

export async function createCategory(input: { name: string; description?: string; image?: string }) {
  const slug = await uniqueCategorySlug(input.name);
  const category = await prisma.category.create({
    data: { name: input.name.trim(), slug, description: input.description?.trim(), image: input.image },
    include: { _count: { select: { products: true } } },
  });
  return categoryResult(category);
}

export async function updateCategory(
  categoryId: string,
  input: { name?: string; description?: string; image?: string },
) {
  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(input.name ? { name: input.name.trim(), slug: await uniqueCategorySlug(input.name, categoryId) } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
    },
    include: { _count: { select: { products: true } } },
  });
  return categoryResult(category);
}

function categoryResult(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count: { products: number };
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    productCount: category._count.products,
  };
}

async function uniqueCategorySlug(name: string, excludeId?: string) {
  const base = slugify(name) || "category";
  let slug = base;
  let suffix = 2;
  while (await prisma.category.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export async function deleteCategory(categoryId: string) {
  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    throw Object.assign(new Error("Move or remove this category's products before deleting it."), { status: 409 });
  }
  const result = await prisma.category.deleteMany({ where: { id: categoryId } });
  return result.count > 0;
}
