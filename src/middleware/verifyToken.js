// src/middleware/verifyToken.js
import jwt from "jsonwebtoken";

/**
 * Normalizes tokens with different payload shapes and ensures req.user.userId exists.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Helpful debug (remove or lower log level in production)
    console.log("verifyToken decoded:", decoded);

    // Normalize common id fields
    const userId = decoded?.userId || decoded?.uid || decoded?.id || decoded?.sub;
    const username = decoded?.username || decoded?.name || null;
    const email = decoded?.email || null;

    if (!userId) {
      console.warn("verifyToken: token decoded but no userId found.", { decoded });
      return res.status(401).json({ error: "Invalid token payload: missing userId" });
    }

    req.user = { userId, username, email };
    return next();
  } catch (err) {
    console.error("verifyToken error:", err?.message || err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
