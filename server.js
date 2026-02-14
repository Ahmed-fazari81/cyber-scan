import express from "express";
import cors from "cors";
import { analyzeWithGemini } from "./analyzer.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/analyze", async (req, res) => {
    try {
        const { text, fileBase64, mimeType, lang } = req.body;

        const result = await analyzeWithGemini({
            apiKey: GEMINI_KEY,
            text,
            fileBase64,
            mimeType,
            lang
        });

        res.json({ result });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("CyberShield API running"));
