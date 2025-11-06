import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// GET /api/videos
router.get("/", async (req, res) => {
  try {
    // Fetch all videos ordered by creation date (descending)
    const snapshot = await db
      .collection("test_videos")
      .orderBy("createdAt", "desc")
      .get();

    // ✅ Fetch user data dynamically for each video
    const videos = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const frames = data.sightengine_result?.data?.frames || [];

        // Explicit content check
        const flagged = frames.some(
          (f) =>
            (f.nudity?.raw ?? 0) > 0.5 ||
            (f.violence?.prob ?? 0) > 0.5 ||
            (f.offensive?.prob ?? 0) > 0.5 ||
            (f.gore?.prob ?? 0) > 0.5 ||
            (f["self-harm"]?.prob ?? 0) > 0.5 ||
            (f.weapon?.prob ?? 0) > 0.5
        );

        // ✅ Fetch latest profile info for uploader
        let userData = {};
        if (data.uploadedBy?.userId) {
          const userDoc = await db.collection("users").doc(data.uploadedBy.userId).get();
          if (userDoc.exists) userData = userDoc.data();
        }

        return {
          id: doc.id,
          s3_url: data.s3_url,
          cdn_url: data.cdn_url,
          title: data.title || "Untitled",
          description: data.description || "",
          explicit: flagged,
          createdAt: data.createdAt,
          likesCount: data.likesCount || 0,
          likedBy: data.likedBy || [],
          uploadedBy: {
            userId: data.uploadedBy?.userId || "unknown",
            username: userData.username || data.uploadedBy?.username || "unknown",
            profileUrl: userData.profileUrl || null, // ✅ always up-to-date
          },
          thumbnail_url: data.thumbnail_url || null,
        };
      })
    );

    res.json({ videos });
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

export default router;
