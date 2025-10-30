import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// ✅ GET /api/auth/check-username?username=ritik
router.get("/", async (req, res) => {

  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "Username is required" });
    }

    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
      .where("username", "==", username.toLowerCase())
      .get();

    const isAvailable = querySnapshot.empty;

    res.json({
      username,
      available: isAvailable,
      message: isAvailable
        ? "Username is available"
        : "Username is already taken",
    });
  } catch (err) {
    console.error("Check username error:", err.message || err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

export default router;
