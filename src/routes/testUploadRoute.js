import express from "express";
import multer from "multer";
import s3 from "../config/s3Config.js";
import { db } from "../config/firebase.js";
import admin from "firebase-admin"; // ✅ Required for FieldValue
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const FieldValue = admin.firestore.FieldValue;

// POST /api/test-upload
router.post("/", verifyToken, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video uploaded" });

    const { title, description } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    // ✅ Upload video to S3
    const key = `test-videos/${Date.now()}_${req.file.originalname || "upload.mp4"}`;
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || "video/mp4",
    };
    const uploaded = await s3.upload(uploadParams).promise();

    // ✅ Save to Firestore (test_videos)
    const videoDoc = {
      filename: key,
      s3_url: uploaded.Location,
      title: title || "Untitled",
      description: description || "",
      uploadedBy: { userId, username },
      createdAt: new Date().toISOString(),
      likesCount: 0, // ✅ Initialize total likes
      likedBy: [], // ✅ Empty array to track which users liked
    };

    const videoRef = await db.collection("test_videos").add(videoDoc);

    // ✅ Add reference under user's document (for profile fetching)
    const userRef = db.collection("users").doc(userId);
    await userRef.set(
      {
        videos: FieldValue.arrayUnion({
          id: videoRef.id,
          title: title || "Untitled",
          s3_url: uploaded.Location,
          createdAt: new Date().toISOString(),
          likesCount: 0, // ✅ also store for quick profile display
        }),
      },
      { merge: true }
    );

    res.json({
      message: "Video uploaded successfully",
      videoId: videoRef.id,
      uploadedBy: username,
      title: title || "Untitled",
      description: description || "",
      s3Url: uploaded.Location,
      likesCount: 0,
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
