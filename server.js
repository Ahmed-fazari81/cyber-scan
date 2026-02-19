import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeContent } from "./analyzer.js";
import { apiLimiter, validateInput } from "./security.js";
import fs from "fs";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(apiLimiter);

app.get("/", (req, res) =>
  res.send("CyberShield Secure Engine Ready")
);

app.post("/analyze", validateInput, async (req, res) => {
  try {
    const { input, type } = req.body;

    const result = await analyzeContent({
      apiKey: process.env.GEMINI_KEY,
      input,
      type
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: "Analysis failed" });
  }
});

/* توليد تقرير نصي */
app.post("/report", (req, res) => {
  const data = req.body;

  const report = `
تقرير أمني - CyberShield

الحالة: ${data.status}
درجة الخطورة: ${data.risk_score}
المصدر: ${data.source}
النوع: ${data.content_type}

الملخص:
${data.summary}

التفاصيل التقنية:
${data.technical_details}

التوصية:
${data.recommendation}
`;

  res.setHeader("Content-Type", "text/plain");
  res.send(report);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Secure Server running on", PORT)
);
