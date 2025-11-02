import express from "express";
import multer from "multer";
import s3 from "../config/s3Config.js";
import { db } from "../config/firebase.js";
import admin from "firebase-admin"; // ✅ Required for FieldValue
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const FieldValue = admin.firestore.FieldValue;

// ✅ Allow both video and optional thumbnail
const uploadFields = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

// POST /api/test-upload
router.post("/", verifyToken, uploadFields, async (req, res) => {
  try {
    const videoFile = req.files?.video?.[0];
    if (!videoFile) return res.status(400).json({ error: "No video uploaded" });

    const thumbFile = req.files?.thumbnail?.[0]; // optional
    const { title, description } = req.body;
    const userId = req.user.userId;
    const username = req.user.username;

    // ✅ Fetch user profile URL (if any)
const userDoc = await db.collection("users").doc(userId).get();
const profileUrl = userDoc.exists ? userDoc.data().profileUrl || null : null;


    // ✅ Upload video to S3
    const videoKey = `test-videos/${Date.now()}_${videoFile.originalname || "upload.mp4"}`;
    const videoParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: videoKey,
      Body: videoFile.buffer,
      ContentType: videoFile.mimetype || "video/mp4",
    };
    const uploadedVideo = await s3.upload(videoParams).promise();

    // ✅ Upload thumbnail (if provided)
    let thumbnailUrl = null;
    if (thumbFile) {
      const thumbKey = `thumbnails/${Date.now()}_${thumbFile.originalname || "thumbnail.jpg"}`;
      const thumbParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: thumbKey,
        Body: thumbFile.buffer,
        ContentType: thumbFile.mimetype || "image/jpeg",
      };
      const uploadedThumb = await s3.upload(thumbParams).promise();
      thumbnailUrl = uploadedThumb.Location;
    }

    // ✅ Save to Firestore (test_videos)
    const videoDoc = {
      filename: videoKey,
      s3_url: uploadedVideo.Location,
      thumbnail_url: thumbnailUrl, // ✅ added field
      title: title || "Untitled",
      description: description || "",
      uploadedBy: { userId, username, profileUrl},
      createdAt: new Date().toISOString(),
      likesCount: 0,
      likedBy: [],
    };

    const videoRef = await db.collection("test_videos").add(videoDoc);

    // ✅ Add reference under user's document
    const userRef = db.collection("users").doc(userId);
    await userRef.set(
      {
        videos: FieldValue.arrayUnion({
          id: videoRef.id,
          title: title || "Untitled",
          s3_url: uploadedVideo.Location,
          thumbnail_url: thumbnailUrl, // ✅ include thumbnail in user doc too
          createdAt: new Date().toISOString(),
          likesCount: 0,
        }),
      },
      { merge: true }
    );

    res.json({
      message: "Video uploaded successfully",
      videoId: videoRef.id,
      uploadedBy: username,
      profileUrl: profileUrl,
      title: title || "Untitled",
      description: description || "",
      s3Url: uploadedVideo.Location,
      thumbnailUrl,
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
