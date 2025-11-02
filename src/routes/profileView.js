import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// GET /api/users/:userId/profile
router.get("/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all videos uploaded by this user
    const snapshot = await db
      .collection("test_videos")
      .where("uploadedBy.userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const videos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        s3_url: data.s3_url,
        thumbnail_url: data.thumbnail_url || data.thumbnail || null,
        title: data.title || "Untitled",
        description: data.description || "",
        explicit: data.explicit || false,
        createdAt: data.createdAt,
        likesCount: data.likesCount || 0, // ✅ include like count
        likedBy: data.likedBy ? data.likedBy.length : 0, // optional backup
        uploadedBy: {
          username: data.uploadedBy?.username || "Unknown",
          profileUrl: data.uploadedBy?.profileUrl || null,
        },
      };
    });

    // If no videos found, still fetch user info
    if (videos.length === 0) {
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.exists
        ? {
            username: userDoc.data().username,
            profileUrl: userDoc.data().profileUrl || null,
          }
        : { username: "Unknown", profilePic: null };

      return res.json({ user: userData, videos: [] });
    }

    // If videos exist, return uploader info from the first one
    return res.json({
      user: videos[0].uploadedBy,
      videos,
    });
  } catch (err) {
    console.error("Profile fetch error:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
