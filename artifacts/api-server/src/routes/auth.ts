import { Router, type IRouter } from "express";
import {
  GetCurrentUserResponse,
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
  UpdateCurrentUserBody,
  UpdateCurrentUserResponse,
} from "@workspace/api-zod";
import { requireAuth, currentUser } from "../middlewares/auth";
import { getUser, loginCustomer, registerCustomer, updateUser } from "../services/customer";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await registerCustomer(parsed.data);
  res.status(201).json(RegisterResponse.parse(result));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await loginCustomer(parsed.data);
  res.json(LoginResponse.parse(result));
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = await getUser(currentUser(req).id);
  if (!user) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  res.json(GetCurrentUserResponse.parse(user));
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateCurrentUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await updateUser(currentUser(req).id, parsed.data);
  res.json(UpdateCurrentUserResponse.parse(user));
});

export default router;
