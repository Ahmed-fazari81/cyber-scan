import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/analyze", async (req, res) => {
    try {
        const { text, fileBase64, mimeType, lang } = req.body;

        const role = lang === "ar"
            ? "أنت خبير أمن سيبراني وتحليل جنائي رقمي."
            : "You are a cybersecurity expert.";

        let body;

        if (fileBase64) {
            body = {
                contents: [{
                    parts: [
                        { text: role + " حلل هذه الوسائط وحدد هل هي آمنة أو خطر أو تزييف." },
                        { inline_data: { mime_type: mimeType, data: fileBase64 } }
                    ]
                }]
            };
        } else {
            body = {
                contents: [{
                    parts: [{
                        text: `${role} حلل الرابط أو النص التالي وحدد مستوى الخطر: ${text}`
                    }]
                }]
            };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();

        res.json({
            result: data.candidates?.[0]?.content?.parts?.[0]?.text || "No result"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("CyberShield API running on port 3000"));
