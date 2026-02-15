import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

// مسار اختبار
app.get("/", (req, res) => {
  res.send("CyberShield API is running");
});

// مسار التحليل
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
                  text: `
قم بتحليل الرابط أو النص التالي.

أجب بكلمة واحدة أو جملة قصيرة فقط، ويفضل إحدى هذه الكلمات:
آمن
خطير
مشبوه

بدون شرح إضافي.

النص:
${input}
`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 🔥 تطبيع النص العربي (إزالة التشكيل والرموز)
    const normalized = text
      .replace(/[^\u0600-\u06FF\s]/g, "") // إزالة الرموز غير العربية
      .replace(/[\u064B-\u0652]/g, "")    // إزالة التشكيل
      .trim();

    let status = "warn";

    if (normalized.includes("امن") || normalized.includes("آمن"))
      status = "safe";
    else if (normalized.includes("خطير") || normalized.includes("خطر"))
      status = "danger";
    else if (normalized.includes("مشبوه"))
      status = "warn";

    res.json({
      status,
      raw: text
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("CyberShield API is running on port " + PORT);
});
