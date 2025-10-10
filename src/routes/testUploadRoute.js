import express from "express";
import multer from "multer";
import s3 from "../config/s3Config.js";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/test-upload
router.post("/", verifyToken, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video uploaded" });

    // user details
    const userId = req.user.userId;
    const username = req.user.username;

    // 1️⃣ Upload to S3
    const key = `test-videos/${Date.now()}_${req.file.originalname || "upload.mp4"}`;
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || "video/mp4",
    };

    const uploaded = await s3.upload(uploadParams).promise();

    // 2️⃣ Save metadata to Firestore
    const doc = {
      filename: key,
      s3_url: uploaded.Location,
      uploadedBy: { userId, username },
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("test_videos").add(doc);

    // 3️⃣ Return success
    return res.json({
      message: "AWS + Firestore test successful",
      s3Url: uploaded.Location,
      uploadedBy: username,
      docId: ref.id,
    });

  } catch (err) {
    console.error("Test upload error:", err?.response?.data || err.message || err);
    return res.status(500).json({
      error: "Server error",
      details: err?.response?.data || err.message,
    });
  }
});

export default router;
