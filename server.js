import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// فحص أن الخادم يعمل
app.get("/", (req, res) => {
  res.send("CyberShield API is running");
});

app.post("/analyze", async (req, res) => {
  try {
    const { input, apiKey } = req.body;

    if (!input || !apiKey) {
      return res.status(400).json({ status: "error", message: "Missing input or API key" });
    }

    const prompt = `
حلل الرابط أو النص التالي وحدد هل هو آمن أم خطير أو مشبوه.
أجب بكلمة واحدة فقط: آمن أو خطير أو مشبوه أو Safe أو Danger أو Suspicious.

النص:
${input}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const normalized = text
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z\s]/g, "")
      .replace(/[\u064B-\u0652]/g, "")
      .trim();

    let status = "warn";

    if (
      normalized.includes("امن") ||
      normalized.includes("آمن") ||
      normalized.includes("safe")
    ) {
      status = "safe";
    } else if (
      normalized.includes("خطير") ||
      normalized.includes("خطر") ||
      normalized.includes("danger")
    ) {
      status = "danger";
    } else if (
      normalized.includes("مشبوه") ||
      normalized.includes("suspicious")
    ) {
      status = "warn";
    }

    res.json({
      status: status,
      ai_response: text
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ status: "error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
