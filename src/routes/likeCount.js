import express from "express";
import { db } from "../config/firebase.js";
import admin from "firebase-admin";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const FieldValue = admin.firestore.FieldValue;

// POST /api/videos/:videoId/like
router.post("/:videoId/like", verifyToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.userId;

    const videoRef = db.collection("test_videos").doc(videoId);
    const videoSnap = await videoRef.get();

    if (!videoSnap.exists) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoData = videoSnap.data();
    const likedBy = videoData.likedBy || [];

    let message = "";
    let newLikesCount = videoData.likesCount || 0;

    if (likedBy.includes(userId)) {
      // ✅ Unlike case
      await videoRef.update({
        likedBy: FieldValue.arrayRemove(userId),
        likesCount: newLikesCount - 1,
      });
      newLikesCount -= 1;

      // Optionally remove from user’s liked list
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        likedVideos: FieldValue.arrayRemove(videoId),
      });

      message = "Video unliked successfully";
    } else {
      // ✅ Like case
      await videoRef.update({
        likedBy: FieldValue.arrayUnion(userId),
        likesCount: newLikesCount + 1,
      });
      newLikesCount += 1;

      // Optionally add to user’s liked list
      const userRef = db.collection("users").doc(userId);
      await userRef.set(
        {
          likedVideos: FieldValue.arrayUnion(videoId),
        },
        { merge: true }
      );

      message = "Video liked successfully";
    }

    res.json({
      message,
      videoId,
      likesCount: newLikesCount,
    });
  } catch (err) {
    console.error("Like video error:", err?.response?.data || err.message || err);
    res.status(500).json({
      error: "Server error",
      details: err?.response?.data || err.message,
    });
  }
});

export default router;
