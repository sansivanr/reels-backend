// import { admin } from "../config/firebase.js";

// export async function authenticate(req, res, next) {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]; // Bearer <idToken>
//     if (!token) return res.status(401).json({ error: "No token provided" });

//     const decoded = await admin.auth().verifyIdToken(token);
//     req.user = decoded; // { uid, email, name, ... }
//     next();
//   } catch (err) {
//     return res.status(401).json({ error: "Invalid token" });
//   }
// }
