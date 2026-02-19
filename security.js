import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests" }
});

export function validateInput(req, res, next) {
  const { input } = req.body;

  if (!input) return res.status(400).json({ error: "No input" });
  if (input.length > 50000)
    return res.status(400).json({ error: "Input too large" });

  next();
}
