import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
// زيادة الحد المسموح به لاستقبال الصور
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("CyberShield Core Engine Active 🛡️");
});

app.post("/analyze", async (req, res) => {
  try {
    // type: 'text' | 'image'
    const { input, type, apiKey } = req.body;

    if (!input || !apiKey)
      return res.status(400).json({ error: "بيانات ناقصة" });

    // هندسة الأوامر (System Prompt)
    const systemPrompt = `
    أنت خبير أمن سيبراني (Cyber Security Expert) ومحقق جنائي رقمي.
    مهمتك تحليل المدخلات سواء كانت روابط، نصوص، أو صور.

    قم بإرجاع النتيجة بصيغة JSON *فقط* وبدون أي تنسيق Markdown (مثل \`\`\`json).
    الهيكل المطلوب:
    {
      "status": "safe" | "suspicious" | "dangerous",
      "risk_score": رقم من 0 لـ 100,
      "type_detected": "Phishing" | "Malware" | "Deepfake" | "Safe Content" | "Scam",
      "summary": "ملخص عربي دقيق",
      "technical_details": "تفاصيل تقنية (لماذا هذا القرار؟)",
      "recommendation": "نصيحة للمستخدم"
    }
    `;

    let requestBody;

    if (type === "image") {
        // إزالة بادئة Base64 إذا وجدت
        const base64Data = input.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        
        requestBody = {
            contents: [{
                parts: [
                    { text: systemPrompt + "\n حلل هذه الصورة. هل هي مفبركة (Deepfake)؟ هل تحتوي على احتيال؟" },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        };
    } else {
        requestBody = {
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nالإدخال للتحليل: ${input}` }]
            }]
        };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    
    // استخراج النص ومحاولة تنظيفه
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    // تنظيف الـ Markdown إن وجد
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const jsonResult = JSON.parse(rawText);
        res.json(jsonResult);
    } catch (e) {
        // في حال فشل الذكاء الاصطناعي في الالتزام بـ JSON
        res.json({
            status: "suspicious",
            risk_score: 50,
            type_detected: "Analysis Error",
            summary: "حدث خطأ في تنسيق النتائج، لكن يرجى الحذر.",
            technical_details: rawText,
            recommendation: "تجنب التعامل مع المحتوى حتى التأكد."
        });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "فشل التحليل الداخلي" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server Running on Port " + PORT));
