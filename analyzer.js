import fetch from "node-fetch";

/* الاتصال بـ Gemini */
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

/* تقييم النطاقات والمصادر */
function evaluateSource(text) {
  if (!text) return { score: 30, label: "unknown" };

  try {
    const urlObj = new URL(text.startsWith('http') ? text : `https://${text}`);
    const hostname = urlObj.hostname.toLowerCase();

    // القائمة البيضاء (مواقع موثوقة عالمياً)
    const trustedEnds = [
      ".gov", ".edu", ".om", "wikipedia.org", "who.int",
      "google.com", "drive.google.com", "docs.google.com", 
      "microsoft.com", "github.com", "apple.com", "youtube.com"
    ];
    
    // القائمة السوداء (مواقع اختصار وروابط مشبوهة)
    const suspicious = ["bit.ly", "tinyurl", "cutt.ly", "free-download", "crack", "hack", "update-account", "verify-info"];

    if (trustedEnds.some(domain => hostname.endsWith(domain))) return { score: 0, label: "trusted" };
    if (suspicious.some(domain => hostname.includes(domain))) return { score: 85, label: "suspicious" };

  } catch (e) {
    return { score: 20, label: "normal" };
  }
  return { score: 20, label: "normal" };
}

/* التحليل المعجمي للكلمات */
function analyzeResponse(text) {
  const dangerWords = [
    "malware", "phishing", "fake", "scam", "virus", "fraud", "deepfake",
    "ضار", "احتيال", "فيروس", "تصيد", "خبيث", "وهمي", "خطير", "اختراق", "مشبوه", "هندسة اجتماعية", "فخ", "تزييف عميق"
  ];

  const hits = dangerWords.filter(w => text.toLowerCase().includes(w));

  if (hits.length >= 2) return { score: 80, status: "danger" };
  if (hits.length === 1) return { score: 40, status: "warning" };
  return { score: 0, status: "safe" };
}

/* الدالة الرئيسية مع الـ Super Prompt */
export async function analyzeWithGemini({ apiKey, text, fileBase64, mimeType, lang = "ar" }) {
  const rolePrompt = `
  أنت محقق جنائي رقمي وخبير أمن سيبراني (Digital Forensics & Cybersecurity Expert).
  مهمتك هي تحليل البيانات المقدمة لك بعمق شديد وتقديم تقرير احترافي.
  إذا كان المدخل رابطاً: حدد نوع المنصة (مثل Google Drive, Dropbox)، نوع الملف المتوقع، وهل هناك أي تلاعب في الرابط (Typosquatting).
  إذا كان المدخل نصاً أو إيميلاً: ابحث عن أساليب الهندسة الاجتماعية (الاستعجال، التهديد، إغراء مالي).
  إذا كانت صورة: ابحث عن أي علامات تدل على التزييف العميق (Deepfake) أو أنها مولدة بالذكاء الاصطناعي (AI-generated)، مثل: تشوهات في الأصابع أو الوجوه، نصوص خلفية غير مفهومة، إضاءة غير منطقية، أو أي نصوص احتيالية بداخلها.
  
  أعطني الرد مقسماً إلى:
  1. طبيعة المحتوى: (شرح تفصيلي لماهية الرابط أو النص أو الصورة).
  2. مؤشرات الخطر: (اذكرها إن وجدت، أو اكتب "لا توجد مؤشرات مرئية").
  3. التوصية الأمنية: (نصيحة للمستخدم).
  `;

  let body;

  if (fileBase64) {
    body = {
      contents: [{
        parts: [
          { text: rolePrompt + "\n\nحلل هذه الصورة/الملف المرفق استقصائياً:" },
          { inline_data: { mime_type: mimeType, data: fileBase64 } }
        ]
      }]
    };
  } else {
    body = {
      contents: [{
        parts: [{ text: rolePrompt + "\n\nحلل هذا النص/الرابط أمنياً:\n" + text }]
      }]
    };
  }

  const aiText = await callGemini(apiKey, body);

  const sourceEval = fileBase64 ? { score: 30, label: "unknown" } : evaluateSource(text);
  const aiEval = analyzeResponse(aiText);

  let finalScore = Math.min(100, Math.round((sourceEval.score + aiEval.score) / 2));
  
  // رفع نسبة الخطر تلقائياً إذا تم اكتشاف تصيد أو تزييف
  if (aiText.includes("هندسة اجتماعية") || aiText.includes("تصيد") || aiText.includes("تزييف عميق") || aiText.includes("Deepfake")) {
    finalScore = Math.max(finalScore, 85);
  }

  let status = "آمن نسبياً";
  if (finalScore >= 70) status = "خطر شديد (تصيد/تزييف/برمجيات خبيثة)";
  else if (finalScore >= 35) status = "مشبوه (يتطلب الحذر)";

  return {
    risk_score: finalScore,
    status,
    summary: "تم إجراء تحليل جنائي رقمي عميق للمحتوى.",
    technical_details: aiText || "لم نتمكن من استخراج تفاصيل معقدة.",
    source: sourceEval.label,
    content_type: fileBase64 ? "image" : "link/text"
  };
}
