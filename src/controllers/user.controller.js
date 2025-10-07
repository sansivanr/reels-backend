// import { db } from "../config/firebase.js";

// export async function getProfile(req, res) {
//   try {
//     const { uid } = req.params;

//     const userDoc = await db.collection("users").doc(uid).get();
//     if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

//     const videosSnap = await db
//       .collection("videos")
//       .where("userId", "==", uid)
//       .orderBy("uploadedAt", "desc")
//       .get();

//     const videos = videosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//     res.json({ user: userDoc.data(), videos });
//   } catch (err) {
//     console.error("Profile error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// }
