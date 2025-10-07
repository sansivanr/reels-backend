import express from "express";
import cors from "cors";
import uploadRoute from "./routes/uploadRoute.js";
import videoRoute from "./routes/videoRoute.js";
import testUploadRoute from "./routes/testUploadRoute.js"

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // not used for file uploads (multer) but safe
app.use("/api/upload", uploadRoute);
app.use("/api/videos", videoRoute);
app.use("/api/test-upload", testUploadRoute);

app.get("/", (req, res) => res.send("Server running ✅"));

export default app;
