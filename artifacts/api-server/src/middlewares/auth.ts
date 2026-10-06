import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

function signingSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET or SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function createAccessToken(user: AuthenticatedUser): string {
  return jwt.sign({ role: user.role }, signingSecret(), {
    subject: user.id,
    expiresIn: "7d",
    issuer: "smart-product-store",
    audience: "smart-product-store-users",
  });
}

export const optionalAuth: RequestHandler = async (req, res, next): Promise<void> => {
  const header = req.header("authorization");
  if (!header) {
    next();
    return;
  }
  try {
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match?.[1]) {
      res.status(401).json({ error: "A valid bearer token is required." });
      return;
    }
    const payload = jwt.verify(match[1], signingSecret(), {
      issuer: "smart-product-store",
      audience: "smart-product-store-users",
    });
    if (typeof payload === "string" || !payload.sub) {
      res.status(401).json({ error: "Invalid session." });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, email: true, name: true },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid session." });
      return;
    }
    req.authUser = user;
    next();
  } catch {
    res.status(401).json({ error: "Your session is invalid or has expired." });
  }
};

export const requireAuth: RequestHandler = (req, res, next): void => {
  if (!req.authUser) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next): void => {
  if (!req.authUser) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  if (req.authUser.role !== UserRole.ADMIN) {
    res.status(403).json({ error: "Administrator access is required." });
    return;
  }
  next();
};

export function currentUser(req: Request): AuthenticatedUser {
  if (!req.authUser) throw new Error("Authentication middleware was not applied.");
  return req.authUser;
}
