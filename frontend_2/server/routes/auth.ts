import { RequestHandler } from "express";
import { z } from "zod";

const users = [
  {
    id: "1",
    name: "John Admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin" as const,
    avatar:
      "https://api.builder.io/api/v1/image/assets/TEMP/f608110c5bb486e70228637345583ddd9f1e7591?width=80",
  },
];

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginHandler: RequestHandler = (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request payload" });
  }
  const { email, password } = parse.data;

  const found = users.find((u) => u.email === email && u.password === password);
  if (!found) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = Buffer.from(`${found.id}:${Date.now()}`).toString("base64");

  return res.json({
    token,
    user: {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      avatar: found.avatar,
    },
  });
};
