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

    const videos = snapshot.docs.map((doc) => {
      const data = doc.data();
      const frames = data.sightengine_result?.data?.frames || [];

      // 🧠 Simple explicit content check
      const flagged = frames.some((f) =>
        (f.nudity?.raw ?? 0) > 0.5 ||
        (f.violence?.prob ?? 0) > 0.5 ||
        (f.offensive?.prob ?? 0) > 0.5 ||
        (f.gore?.prob ?? 0) > 0.5 ||
        (f["self-harm"]?.prob ?? 0) > 0.5 ||
        (f.weapon?.prob ?? 0) > 0.5
      );

      return {
        id: doc.id,
        s3_url: data.s3_url,
        title: data.title || "Untitled",
        description: data.description || "",
        explicit: flagged,
        createdAt: data.createdAt,
        likesCount: data.likesCount || 0, // ✅ Like count added
        uploadedBy: {
          userId: data.uploadedBy?.userId || "unknown",
          username: data.uploadedBy?.username || "unknown",
          profilePic: data.uploadedBy?.profilePic || null, // ✅ added profile pic
        },
      };
    });

    res.json({ videos });
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

export default router;
