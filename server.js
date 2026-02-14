import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

/* مسار رئيسي للتأكد أن الخادم يعمل */
app.get("/", (req, res) => {
  res.send("CyberShield API is running");
});

/* مسار التحليل */
app.post("/analyze", async (req, res) => {
  const { input, apiKey } = req.body;

  if (!apiKey || !input) {
    return res.status(400).json({ error: "Missing input or API key" });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `قم بتحليل الرابط أو النص التالي وتحديد هل هو آمن أو خطير أو مشبوه فقط بكلمة واحدة:
${input}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let status = "warn";
    if (text.includes("آمن")) status = "safe";
    if (text.includes("خطير")) status = "danger";

    res.json({ status, raw: text });

  } catch (error) {
    res.status(500).json({ error: "AI analysis failed" });
  }
});

/* مهم جدا لـ Render */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("CyberShield API running on port", PORT);
});
