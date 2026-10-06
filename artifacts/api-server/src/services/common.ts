import type { Prisma } from "@prisma/client";

export function asIso(value: Date): string {
  return value.toISOString();
}

export function cleanText(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function toUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences: string[];
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferences: user.preferences,
    createdAt: asIso(user.createdAt),
  };
}

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export function toProduct(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    image: product.image,
    images: product.images,
    inventory: product.inventory,
    rating: product.rating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    featured: product.featured,
    attributes: (product.attributes ?? {}) as Record<string, string>,
  };
}

export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: { user: { select: { name: true } } };
}>;

export function toReview(review: ReviewWithUser) {
  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: review.user.name,
    rating: review.rating,
    comment: review.comment,
    createdAt: asIso(review.createdAt),
  };
}

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    items: true;
  };
}>;

export function toOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    total: order.total,
    customerName: order.user.name,
    customerEmail: order.user.email,
    shippingAddress: `${order.shippingAddress}, ${order.shippingCity} ${order.shippingPostalCode}`,
    createdAt: asIso(order.createdAt),
    items: order.items.map((item) => ({
      productId: item.productId ?? "",
      productName: item.productName,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}
