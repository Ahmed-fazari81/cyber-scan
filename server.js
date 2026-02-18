import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("CyberShield Core Engine Active 🛡️");
});

app.post("/analyze", async (req, res) => {
  try {
    const { input, type, apiKey } = req.body;

    if (!input || !apiKey)
      return res.status(400).json({ error: "بيانات ناقصة" });

    // هندسة الأوامر بدقة عالية
    const systemPrompt = `
    أنت خبير أمن سيبراني (Cyber Security Expert) ومحقق جنائي رقمي.
    مهمتك تحليل المدخلات بدقة.
    
    التعليمات:
    1. قم بتحليل الرابط أو النص أو الصورة.
    2. إذا كان الرابط يبدأ بـ http وليس https، اعتبره "suspicious" (مشبوه) لأنه غير مشفر، واشرح ذلك.
    3. أكتب النتيجة باللغة العربية فقط.
    4. يجب أن يكون الرد بصيغة JSON حصراً (بدون markdown).

    الهيكل المطلوب للرد (JSON):
    {
      "status": "safe" أو "suspicious" أو "dangerous",
      "risk_score": رقم من 0 إلى 100,
      "type_detected": "Phishing" أو "Malware" أو "Encryption Issue" أو "Safe",
      "summary": "ملخص عربي واضح للنتيجة",
      "technical_details": "شرح تقني (مثلا: الشهادة منتهية، البروتوكول غير آمن، الكود سليم...)",
      "recommendation": "خطوات عملية للمستخدم"
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
                parts: [{ text: `${systemPrompt}\n\nالمدخل المراد فحصه: ${input}` }]
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
    
    // استخراج النص الخام
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // --- (التصحيح الجوهري) دالة استخراج JSON بدقة ---
    // نبحث عن أول قوس { وآخر قوس } ونتجاهل كل شيء قبلهما أو بعدهما
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        rawText = rawText.substring(firstBrace, lastBrace + 1);
    }
    // ------------------------------------------------

    try {
        const jsonResult = JSON.parse(rawText);
        res.json(jsonResult);
    } catch (e) {
        console.error("JSON Parse Error:", rawText);
        // في حال فشل التحليل، نعيد رسالة خطأ منظمة بدلاً من الانهيار
        res.json({
            status: "suspicious",
            risk_score: 50,
            type_detected: "Analysis Error",
            summary: "لم نتمكن من قراءة البيانات بشكل دقيق، لكن كن حذراً.",
            technical_details: "فشل النظام في معالجة رد الذكاء الاصطناعي: " + rawText.substring(0, 50) + "...",
            recommendation: "حاول مرة أخرى أو تأكد من الرابط."
        });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "فشل داخلي في الخادم" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server Running on Port " + PORT));
