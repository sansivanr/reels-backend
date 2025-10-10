import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import s3 from "../config/s3Config.js"; // updated import
import { db } from "../config/firebase.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/register
router.post("/", upload.single("profilePic"), async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Check if username already exists
    const userSnapshot = await db.collection("users").where("username", "==", username).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Handle profile picture (optional)
    let profileUrl = "https://i.pravatar.cc/150"; // default avatar
    if (req.file) {
      const fileKey = `profiles/${username}-${uuidv4()}`;
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      const uploaded = await s3.upload(uploadParams).promise();
      profileUrl = uploaded.Location;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in Firestore
    const userRef = await db.collection("users").add({
      username,
      password: hashedPassword,
      profileUrl,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      message: "User registered successfully",
      user: { id: userRef.id, username, profileUrl },
    });
  } catch (err) {
    console.error("Register error:", err.message || err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
