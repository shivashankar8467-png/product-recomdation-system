import {
  BehaviorType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { createAccessToken, type AuthenticatedUser } from "../middlewares/auth";
import { asIso, cleanText, toOrder, toProduct, toReview, toUser } from "./common";

const cartInclude = {
  items: { include: { product: { include: { category: true } } } },
} satisfies Prisma.CartInclude;

export async function registerCustomer(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw Object.assign(new Error("An account with this email already exists."), { status: 409 });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: cleanText(input.name),
      cart: { create: {} },
    },
  });
  return {
    token: createAccessToken({ id: user.id, email: user.email, name: user.name, role: user.role }),
    user: toUser(user),
  };
}

export async function loginCustomer(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw Object.assign(new Error("Email or password is incorrect."), { status: 401 });
  }
  const identity: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return { token: createAccessToken(identity), user: toUser(user) };
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUser(user) : null;
}

export async function updateUser(
  userId: string,
  input: { name?: string; preferences?: string[] },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: cleanText(input.name) } : {}),
      ...(input.preferences !== undefined
        ? { preferences: [...new Set(input.preferences.map((item) => cleanText(item)).filter(Boolean))] }
        : {}),
    },
  });
  return toUser(user);
}

export async function getCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });
  const items = cart.items.map((line) => ({
    product: toProduct(line.product),
    quantity: line.quantity,
    lineTotal: Number((line.quantity * line.product.price).toFixed(2)),
  }));
  return {
    items,
    subtotal: Number(items.reduce((total, line) => total + line.lineTotal, 0).toFixed(2)),
    itemCount: items.reduce((total, line) => total + line.quantity, 0),
  };
}

export async function addCartItem(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw Object.assign(new Error("Product not found."), { status: 404 });
  if (product.inventory < quantity) {
    throw Object.assign(new Error("There is not enough stock for that quantity."), { status: 409 });
  }
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: { increment: quantity } },
    }),
    prisma.behaviorEvent.create({
      data: { userId, productId, type: BehaviorType.ADD_TO_CART },
    }),
  ]);
  return getCart(userId);
}

export async function updateCartItem(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { inventory: true } });
  if (!product) throw Object.assign(new Error("Product not found."), { status: 404 });
  if (product.inventory < quantity) {
    throw Object.assign(new Error("There is not enough stock for that quantity."), { status: 409 });
  }
  const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
  const existing = cart
    ? await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
        select: { id: true },
      })
    : null;
  if (!existing) throw Object.assign(new Error("That item is not in your cart."), { status: 404 });
  await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
  return getCart(userId);
}

export async function removeCartItem(userId: string, productId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId }, select: { id: true } });
  if (cart) {
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      select: { id: true },
    });
    if (existing) {
      await prisma.$transaction([
        prisma.cartItem.delete({ where: { id: existing.id } }),
        prisma.behaviorEvent.create({
          data: { userId, productId, type: BehaviorType.REMOVE_FROM_CART },
        }),
      ]);
    }
  }
  return getCart(userId);
}

export async function getWishlist(userId: string) {
  const entries = await prisma.wishlist.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return entries.map((entry) => toProduct(entry.product));
}

export async function addWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw Object.assign(new Error("Product not found."), { status: 404 });
  await prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
  await prisma.behaviorEvent.create({
    data: { userId, productId, type: BehaviorType.WISHLIST },
  });
}

export async function removeWishlistItem(userId: string, productId: string) {
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
}

export async function listOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { user: { select: { name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(toOrder);
}

export async function getOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { user: { select: { name: true, email: true } }, items: true },
  });
  return order ? toOrder(order) : null;
}

export async function createOrder(
  userId: string,
  input: {
    paymentMethod: "COD" | "MOCK_ONLINE";
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
  },
) {
  const created = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart?.items.length) throw Object.assign(new Error("Your cart is empty."), { status: 400 });
    for (const line of cart.items) {
      if (line.product.inventory < line.quantity) {
        throw Object.assign(new Error(`${line.product.name} no longer has enough stock.`), { status: 409 });
      }
    }
    const total = Number(
      cart.items.reduce((sum, line) => sum + line.quantity * line.product.price, 0).toFixed(2),
    );
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const order = await tx.order.create({
      data: {
        orderNumber: `SP-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
        userId,
        total,
        paymentMethod: input.paymentMethod as PaymentMethod,
        paymentStatus: input.paymentMethod === "MOCK_ONLINE" ? PaymentStatus.PAID : PaymentStatus.PENDING,
        shippingName: cleanText(input.shippingName),
        shippingPhone: cleanText(input.shippingPhone),
        shippingAddress: cleanText(input.shippingAddress),
        shippingCity: cleanText(input.shippingCity),
        shippingPostalCode: cleanText(input.shippingPostalCode),
        items: {
          create: cart.items.map((line) => ({
            productId: line.productId,
            productName: line.product.name,
            image: line.product.image,
            quantity: line.quantity,
            unitPrice: line.product.price,
          })),
        },
      },
      include: { user: { select: { name: true, email: true } }, items: true },
    });
    await Promise.all(
      cart.items.map(async (line) => {
        await tx.product.update({
          where: { id: line.productId },
          data: { inventory: { decrement: line.quantity }, soldCount: { increment: line.quantity } },
        });
        await tx.behaviorEvent.create({
          data: { userId, productId: line.productId, type: BehaviorType.PURCHASE },
        });
        const recommendation = await tx.recommendation.findUnique({
          where: { userId_productId: { userId, productId: line.productId } },
          select: { id: true },
        });
        if (recommendation) {
          await tx.recommendationEvent.create({
            data: {
              userId,
              recommendationId: recommendation.id,
              productId: line.productId,
              type: "PURCHASE",
              revenue: line.product.price * line.quantity,
            },
          });
        }
      }),
    );
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return order;
  });
  return toOrder(created);
}

export async function listProductReviews(productId: string) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    select: { id: true },
  });
  if (!product) return null;
  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return reviews.map(toReview);
}

export async function createProductReview(
  userId: string,
  productId: string,
  input: { rating: number; comment: string },
) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    select: { id: true },
  });
  if (!product) throw Object.assign(new Error("Product not found."), { status: 404 });
  const review = await prisma.review.upsert({
    where: { productId_userId: { productId: product.id, userId } },
    create: { productId: product.id, userId, rating: input.rating, comment: cleanText(input.comment) },
    update: { rating: input.rating, comment: cleanText(input.comment) },
    include: { user: { select: { name: true } } },
  });
  const aggregate = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: { rating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count._all },
    }),
    prisma.behaviorEvent.create({
      data: { userId, productId: product.id, type: BehaviorType.RATING },
    }),
  ]);
  return toReview(review);
}

export async function trackBehavior(
  userId: string,
  input: {
    type: string;
    productId?: string | null;
    categoryId?: string | null;
    searchQuery?: string | null;
    durationMs?: number | null;
  },
) {
  const event = await prisma.behaviorEvent.create({
    data: {
      userId,
      type: input.type as BehaviorType,
      productId: input.productId || undefined,
      categoryId: input.categoryId || undefined,
      searchQuery: input.searchQuery ? cleanText(input.searchQuery).slice(0, 250) : undefined,
      durationMs: input.durationMs ?? undefined,
    },
  });
  return { id: event.id, type: event.type, createdAt: asIso(event.createdAt) };
}

export async function recordRecommendationEvent(
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
      productId: input.productId,
      recommendationId: recommendation?.id,
      type: input.type,
    },
  });
  return { id: event.id, type: event.type, createdAt: asIso(event.createdAt) };
}
