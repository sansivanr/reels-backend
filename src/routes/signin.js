import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// POST /api/signin
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Find user in Firestore
    const userSnapshot = await db.collection("users").where("username", "==", username).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // jwt
    const token = jwt.sign(
      { userId: userDoc.id, username: userData.username },
      process.env.JWT_SECRET || "yourSecretKey",
      { expiresIn: "7d" }
    );

    // Success response including profile picture
    return res.json({
      message: "Sign-in successful",
      token,
      user: {
        id: userDoc.id,
        username: userData.username,
        profileUrl: userData.profileUrl, // profile pic fetched from Firestore
      },
    });
  } catch (err) {
    console.error("Sign-in error:", err.message || err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
