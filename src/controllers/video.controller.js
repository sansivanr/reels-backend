// import { unlinkSync, createReadStream, readFileSync } from "fs";
// import FormData from "form-data";
// import axios from "axios";
// import s3 from "../config/s3.js";
// import { db, admin } from "../config/firebase.js";
// import { getVideoDuration } from "../utils/ffmpeg.js";
// import { SIGHTENGINE_USER, SIGHTENGINE_SECRET } from "../config/sightengine.js";

// const videosCollection = db.collection("videos");

// export async function uploadVideo(req, res) {
//   try {
//     const filePath = req.file.path;

//     // 1️⃣ Check duration
//     const duration = await getVideoDuration(filePath);
//     if (duration > 60) {
//       unlinkSync(filePath);
//       return res.status(400).json({ error: "Video must be less than 1 minute long" });
//     }

//     // 2️⃣ Sightengine moderation
//     const formData = new FormData();
//     formData.append("media", createReadStream(filePath));
//     formData.append(
//       "models",
//       "nudity-2.1,violence,offensive,weapon,gore-2.0,recreational_drug,alcohol,gambling,tobacco,money,self-harm"
//     );
//     formData.append("api_user", SIGHTENGINE_USER);
//     formData.append("api_secret", SIGHTENGINE_SECRET);

//     let result;
//     try {
//       const response = await axios.post(
//         "https://api.sightengine.com/1.0/video/check-sync.json",
//         formData,
//         { headers: formData.getHeaders() }
//       );
//       result = response.data;
//     } catch (err) {
//       unlinkSync(filePath);
//       return res.status(500).json({ error: "Sightengine API error" });
//     }

//     // 3️⃣ Safe/unsafe verdict
//     let verdict = "SAFE";
//     if (
//       result.nudity?.raw > 0.3 ||
//       result.violence?.raw > 0.3 ||
//       result.recreational_drug?.raw > 0.2 ||
//       result.gore?.raw > 0.2
//     ) {
//       verdict = "UNSAFE";
//     }

//     // 4️⃣ Upload to S3
//     const fileContent = readFileSync(filePath);
//     const s3Data = await s3
//       .upload({
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: `videos/${Date.now()}-${req.file.originalname}`,
//         Body: fileContent,
//         ContentType: req.file.mimetype,
//       })
//       .promise();

//     // 5️⃣ Save metadata in Firestore
//     await videosCollection.add({
//       userId: req.user.uid, // comes from middleware
//       fileName: req.file.originalname,
//       s3Url: s3Data.Location,
//       verdict,
//       details: result,
//       uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     // 6️⃣ Cleanup
//     unlinkSync(filePath);

//     res.json({ status: "success", verdict, s3Url: s3Data.Location, details: result });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// }
