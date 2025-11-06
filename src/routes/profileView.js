import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// GET /api/users/:userId/profile
router.get("/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user info from "users" collection
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists
      ? {
          username: userDoc.data().username || "Unknown",
          profileUrl: userDoc.data().profileUrl || null,
        }
      : { username: "Unknown", profileUrl: null };

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
        cdn_url: data.cdn_url,
        thumbnail_url: data.thumbnail_url || data.thumbnail || null,
        title: data.title || "Untitled",
        description: data.description || "",
        explicit: data.explicit || false,
        createdAt: data.createdAt,
        likesCount: data.likesCount || 0,
        likedBy: data.likedBy ? data.likedBy.length : 0,
        uploadedBy: userData, // ✅ use latest info from users collection
      };
    });

    return res.json({
      user: userData,
      videos,
    });
  } catch (err) {
    console.error("Profile fetch error:", err?.message || err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
