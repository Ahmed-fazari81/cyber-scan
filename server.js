import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => res.send("CyberShield Engine Ready 2026 🛡️"));

app.post("/analyze", async (req, res) => {
  try {
    const { input, type, apiKey } = req.body;

    if (!input || !apiKey) return res.status(400).json({ error: "Missing Data" });

    // هندسة أوامر دقيقة جداً لإجبار النموذج على استخراج المصدر
    const systemPrompt = `
    أنت خبير أمن سيبراني ومحقق جنائي رقمي (Digital Forensics).
    حلل المدخلات بدقة متناهية باللغة العربية.

    المطلوب: استخراج تقرير بصيغة JSON *فقط* يحتوي على الحقول التالية بدقة:
    1. "status": (safe, suspicious, dangerous).
    2. "risk_score": (0-100).
    3. "source": اسم الموقع أو المصدر (مثلاً: Wikipedia, Facebook, WhatsApp, Unknown).
    4. "content_type": نوع المحتوى (مثلاً: صورة، مقال، رابط تشعبي، ملف).
    5. "summary": ملخص دقيق يذكر المصدر (مثلاً: "هذا رابط لصورة من موقع ويكيبيديا وهي تبدو آمنة").
    6. "technical_details": لماذا اتخذت هذا القرار؟
    7. "recommendation": نصيحة للمستخدم.

    ملاحظة هامة: إذا كان الرابط يبدأ بـ http (بدون s) اعتبره suspicious.
    `;

    let requestBody;
    
    if (type === "image") {
        const base64Data = input.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        requestBody = {
            contents: [{
                parts: [
                    { text: systemPrompt + "\n حلل هذه الصورة ومصدرها المحتمل:" },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        };
    } else {
        requestBody = {
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nالمدخل للتحليل: ${input}` }]
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
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // تنظيف الرد لاستخراج JSON فقط (إزالة أي نصوص إضافية)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const jsonResult = JSON.parse(jsonMatch[0]);
            res.json(jsonResult);
        } catch (e) {
            throw new Error("JSON Parsing Failed");
        }
    } else {
        throw new Error("No JSON found");
    }

  } catch (err) {
    console.error("Analysis Error:", err);
    // رد احتياطي في حالة الخطأ لكي لا يظهر undefined
    res.json({
        status: "suspicious",
        risk_score: 50,
        source: "غير معروف",
        content_type: "تحليل عام",
        summary: "لم نتمكن من تحديد المصدر بدقة، يرجى التحقق يدوياً.",
        technical_details: "حدث خطأ أثناء معالجة رد الذكاء الاصطناعي.",
        recommendation: "توخ الحذر ولا تفتح الرابط إذا لم تكن متأكداً."
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
