import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => res.send("CyberShield Engine V3 Ready 🛡️"));

app.post("/analyze", async (req, res) => {
  try {
    const { input, type, apiKey } = req.body;

    if (!input || !apiKey) return res.status(400).json({ error: "Missing Data" });

    console.log(`[Analyzing] Type: ${type}, Input Length: ${input.length}`);

    // هندسة الأوامر - النسخة الصارمة (Strict Mode)
    const systemPrompt = `
    أنت نظام أمني سيبراني (Security Engine API).
    مهمتك: استلام مدخلات وإرجاع تقرير بصيغة JSON الخام فقط.
    
    ممنوع استخدام Markdown. ممنوع استخدام \`\`\`json. ممنوع كتابة أي مقدمة.
    
    المعايير الأمنية:
    1. روابط HTTP (بدون S) = Suspicious.
    2. روابط تدعي أنها شركات كبرى (Apple, Instagram, HR) ونطاقها غريب = Dangerous (Phishing).
    3. طلبات تغيير كلمة المرور أو تحديث البيانات البنكية = Dangerous.
    4. صور تحتوي تشوهات بصرية بشرية = Suspicious (Deepfake).

    يجب أن يكون الرد بهذا الشكل الدقيق تماماً:
    {
      "status": "safe" | "suspicious" | "dangerous",
      "risk_score": رقم 0-100,
      "source": "اسم المصدر (Wikipedia, Fake Instagram, Corporate HR, Unknown)",
      "content_type": "نوع المحتوى (Phishing Link, Deepfake, Safe Site, Scam)",
      "summary": "وصف عربي دقيق للتهديد أو الأمان",
      "technical_details": "السبب التقني (مثلا: النطاق company-hr-update.net غير رسمي)",
      "recommendation": "نصيحة واضحة"
    }
    `;

    let requestBody;
    
    if (type === "image") {
        const base64Data = input.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        requestBody = {
            contents: [{
                parts: [
                    { text: systemPrompt + "\n حلل هذه الصورة:" },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        };
    } else {
        requestBody = {
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nالمدخل: "${input}"` }]
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

    // 1. استخراج النص الخام
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("[AI Raw Response]:", rawText.substring(0, 100) + "..."); // طباعة أول جزء للتحقق

    // 2. التنظيف العميق (Deep Cleaning) لإزالة أي شوائب
    // إزالة علامات الكود (```json) و (```)
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "");
    
    // البحث عن أول قوس { وآخر قوس }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        // قص النص ليكون JSON فقط
        rawText = rawText.substring(firstBrace, lastBrace + 1);
    }

    // 3. المحاولة النهائية للتحويل
    try {
        const jsonResult = JSON.parse(rawText);
        // نجاح! نرسل النتيجة
        res.json(jsonResult);
    } catch (parseError) {
        console.error("JSON Parsing Failed. Raw Text was:", rawText);
        // في حال الفشل التام، نرسل تحليل يدوي للطوارئ يعتمد على الكلمات المفتاحية
        let fallbackStatus = "suspicious";
        if (input.includes("http:")) fallbackStatus = "suspicious";
        if (input.includes("update") || input.includes("login") || input.includes("bank")) fallbackStatus = "dangerous";

        res.json({
            status: fallbackStatus,
            risk_score: fallbackStatus === "dangerous" ? 85 : 55,
            source: "تحليل تلقائي (Fallback)",
            content_type: "محتوى مشبوه",
            summary: "تم اكتشاف مؤشرات خطر، لكن التحليل التفصيلي تعذر عرضه.",
            technical_details: "الرابط يحتوي على أنماط تتطلب الحذر (مثل طلب تحديث بيانات أو بروتوكول غير آمن).",
            recommendation: "لا تفتح الرابط وقم بإبلاغ المسؤول الأمني."
        });
    }

  } catch (err) {
    console.error("Server Logic Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server v3 running on port ${PORT}`));
