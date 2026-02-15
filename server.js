import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("CyberScan AI Security Engine Running");
});

app.post("/analyze", async (req, res) => {
  try {
    const { input, apiKey } = req.body;

    if (!input || !apiKey)
      return res.status(400).json({ error: "Missing data" });

    let prompt = `
أنت نظام تحليل أمني سيبراني احترافي.

قم بتحليل الإدخال التالي وأعط تقريرًا بصيغة JSON فقط يحتوي:

status: safe / suspicious / dangerous
risk_score: رقم من 0 إلى 100
summary: وصف مختصر
details: تحليل تقني
ai_generated_probability: نسبة احتمال أن يكون المحتوى مولد بالذكاء الاصطناعي (إن كان صورة أو فيديو)

الإدخال:
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

    res.json({
      raw: text
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "analysis failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("CyberScan Server Ready"));
