// import { admin, db } from "../config/firebase.js";

// export async function googleAuth(req, res) {
//   try {
//     const { idToken, username } = req.body;

//     const decoded = await admin.auth().verifyIdToken(idToken);
//     const uid = decoded.uid;
//     const email = decoded.email;

//     const userRef = db.collection("users").doc(uid);
//     await userRef.set(
//       {
//         email,
//         username,
//         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//       },
//       { merge: true }
//     );

//     res.json({ status: "success", uid, email, username });
//   } catch (err) {
//     console.error("Auth error:", err);
//     res.status(401).json({ error: "Invalid Google token" });
//   }
// }
