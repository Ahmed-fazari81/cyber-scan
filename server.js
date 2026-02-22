import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeWithGemini } from "./analyzer.js";
import { apiLimiter, validateInput } from "./security.js";

dotenv.config();

const app = express();

// إعداد مهم جداً للاستضافة على Render لكي يعمل Rate Limit بشكل صحيح
app.set("trust proxy", 1);

// حماية مسار الـ API ليسمح فقط لتطبيقك على جيت هب بالاتصال به
app.use(cors({
  origin: ['https://ahmed-fazari81.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500']
}));

app.use(express.json({ limit: "5mb" }));
app.use(apiLimiter);

app.get("/", (req, res) =>
  res.send("CyberShield Secure Engine Ready 🛡️")
);

app.post("/analyze", validateInput, async (req, res) => {
  try {
    const { input, type } = req.body;
    let options = { apiKey: process.env.GEMINI_KEY };

    // تجهيز البيانات حسب نوعها ليقبلها Gemini بشكل صحيح
    if (type === "image") {
      const matches = input.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ error: "صيغة صورة غير صالحة" });
      
      options.mimeType = matches[1];
      options.fileBase64 = matches[2];
    } else {
      options.text = input;
    }

    const result = await analyzeWithGemini(options);
    res.json(result);

  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Secure Server running on port", PORT)
);
