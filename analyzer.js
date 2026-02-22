import fetch from "node-fetch";

/* تحليل Gemini */
async function callGemini(apiKey, body) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/* تقييم سمعة الرابط بشكل آمن */
function evaluateSource(text) {
  if (!text) return { score: 40, label: "unknown" };

  try {
    // التأكد من استخراج النطاق (Domain) فقط بدلاً من البحث في كامل النص
    const urlObj = new URL(text.startsWith('http') ? text : `https://${text}`);
    const hostname = urlObj.hostname.toLowerCase();

    const trustedEnds = [".gov", ".edu", "wikipedia.org", "who.int"];
    const suspicious = ["bit.ly", "tinyurl", "cutt.ly", "free-download", "crack", "hack"];

    if (trustedEnds.some(domain => hostname.endsWith(domain)))
      return { score: 5, label: "trusted" };

    if (suspicious.some(domain => hostname.includes(domain)))
      return { score: 85, label: "suspicious" };

  } catch (e) {
    // إذا لم يكن الرابط صالحاً
    return { score: 35, label: "normal" };
  }

  return { score: 35, label: "normal" };
}

/* تحليل الرد - متوافق مع اللغة العربية */
function analyzeResponse(text) {
  const dangerWords = [
    "malware", "phishing", "fake", "scam", "virus", "fraud",
    "ضار", "احتيال", "فيروس", "تصيد", "خبيث", "وهمي", "خطير", "اختراق", "مشبوه"
  ];

  const hits = dangerWords.filter(w =>
    text.toLowerCase().includes(w)
  );

  if (hits.length >= 2) return { score: 80, status: "danger" };
  if (hits.length === 1) return { score: 50, status: "warning" };
  return { score: 10, status: "safe" };
}

/* الدالة الرئيسية المصدرة للخادم */
export async function analyzeWithGemini({ apiKey, text, fileBase64, mimeType, lang = "ar" }) {
  const role = "أنت خبير أمن سيبراني. صف المخاطر إن وجدت فقط باختصار.";
  let body;

  if (fileBase64) {
    body = {
      contents: [{
        parts: [
          { text: role + " هل هذه الصورة أو محتواها يحتوي على تهديد رقمي؟" },
          { inline_data: { mime_type: mimeType, data: fileBase64 } }
        ]
      }]
    };
  } else {
    body = {
      contents: [{
        parts: [{ text: role + " حلل الرابط أو النص التالي أمنياً: " + text }]
      }]
    };
  }

  const aiText = await callGemini(apiKey, body);

  const sourceEval = fileBase64 ? { score: 40, label: "unknown" } : evaluateSource(text);
  const aiEval = analyzeResponse(aiText);

  // حساب النتيجة النهائية
  const finalScore = Math.min(100, Math.round((sourceEval.score + aiEval.score) / 2));

  let status = "safe";
  if (finalScore >= 70) status = "danger";
  else if (finalScore >= 40) status = "warning";

  return {
    risk_score: finalScore,
    status,
    summary: aiText ? "اكتمل التحليل الذكي" : "لم يتم اكتشاف تهديدات واضحة",
    technical_details: aiText || "لا توجد تفاصيل إضافية",
    source: sourceEval.label,
    content_type: fileBase64 ? "image" : "link/text"
  };
}
