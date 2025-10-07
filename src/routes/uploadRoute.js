import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Thresholds per category
const THRESHOLDS = {
  nudity: 0.5,
  alcohol: 0.1,
  recreational_drug: 0.1,
  violence: 0.3,
  gore: 0.3,
  offensive: 0.3,
  weapon: 0.3,
  gambling: 0.1,
  tobacco: 0.1,
  money: 0.1,
  self_harm: 0.3,
};

router.post("/", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video uploaded" });

    // 1️⃣ Save temp file
    const tmpDir = path.join(process.cwd(), "tmp_uploads");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFilePath = path.join(tmpDir, `video_${Date.now()}.mp4`);
    fs.writeFileSync(tmpFilePath, req.file.buffer);

    // 2️⃣ Prepare Sightengine request
    const formData = new FormData();
    formData.append("media", fs.createReadStream(tmpFilePath));
    formData.append(
      "models",
      "nudity-2.1,violence,gore-2.0,offensive,weapon,face-analysis,recreational_drug,alcohol,gambling,tobacco,money,self-harm"
    );
    formData.append("api_user", process.env.SIGHTENGINE_USER);
    formData.append("api_secret", process.env.SIGHTENGINE_SECRET);

    const response = await axios.post(
      "https://api.sightengine.com/1.0/video/check-sync.json",
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    // 3️⃣ Clean up temp file
    try { fs.unlinkSync(tmpFilePath); } catch (e) {}

    const result = response.data;
    if (result.status !== "success") {
      return res.status(400).json({ error: "Moderation failed", details: result });
    }

    // 4️⃣ Aggregate scores across all frames
    const frames = result.data.frames || [];
    const maxScore = key =>
      Math.max(...frames.map(f => {
        if (key === "nudity") return f.nudity?.raw ?? 0;
        if (key === "alcohol") return f.alcohol?.prob ?? 0;
        if (key === "recreational_drug") return f.recreational_drug?.prob ?? 0;
        if (key === "violence") return f.violence?.prob ?? 0;
        if (key === "gore") return f.gore?.prob ?? 0;
        if (key === "offensive") return f.offensive?.prob ?? 0;
        if (key === "weapon") return f.weapon?.classes ? Math.max(...Object.values(f.weapon.classes)) : 0;
        if (key === "gambling") return f.gambling?.prob ?? 0;
        if (key === "tobacco") return f.tobacco?.prob ?? 0;
        if (key === "money") return f.money?.prob ?? 0;
        if (key === "self_harm") return f["self-harm"]?.prob ?? 0;
        return 0;
      }));

    const scores = {
      nudity: maxScore("nudity"),
      alcohol: maxScore("alcohol"),
      drugs: maxScore("recreational_drug"),
      violence: maxScore("violence"),
      gore: maxScore("gore"),
      offensive: maxScore("offensive"),
      weapon: maxScore("weapon"),
      gambling: maxScore("gambling"),
      tobacco: maxScore("tobacco"),
      money: maxScore("money"),
      self_harm: maxScore("self_harm"),
    };

    // 5️⃣ Flag content based on thresholds
    const flags = {};
    Object.keys(scores).forEach(key => {
      flags[key] = scores[key] >= (THRESHOLDS[key] || 0.5);
    });

    return res.json({
      flags,
      scores,
      message: "✅ Moderation completed",
      details: result,
    });

  } catch (err) {
    console.error("Sightengine error:", err?.response?.data || err.message || err);
    return res.status(500).json({
      error: "Server error",
      details: err?.response?.data || err.message,
    });
  }
});

export default router;
