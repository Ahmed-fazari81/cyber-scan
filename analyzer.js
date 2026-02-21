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

/* تقييم سمعة الرابط */
function evaluateSource(text) {
  if (!text) return { score: 40, label: "unknown" };

  const trusted = [
    "wikipedia.org",
    "gov",
    "edu",
    "who.int"
  ];

  const suspicious = [
    "bit.ly",
    "tinyurl",
    "free-download",
    "crack",
    "hack"
  ];

  if (trusted.some(d => text.includes(d)))
    return { score: 5, label: "trusted" };

  if (suspicious.some(d => text.includes(d)))
    return { score: 85, label: "suspicious" };

  return { score: 35, label: "normal" };
}

/* تحليل الرد */
function analyzeResponse(text) {
  const dangerWords = [
    "malware",
    "phishing",
    "fake",
    "scam",
    "virus",
    "fraud"
  ];

  const hits = dangerWords.filter(w =>
    text.toLowerCase().includes(w)
  );

  if (hits.length >= 2)
    return { score: 80, status: "danger" };

  if (hits.length === 1)
    return { score: 50, status: "warning" };

  return { score: 10, status: "safe" };
}

/* الدالة الرئيسية */
export async function analyzeWithGemini({
  apiKey,
  text,
  fileBase64,
  mimeType,
  lang = "ar"
}) {

  const role = "أنت خبير أمن سيبراني. صف المخاطر إن وجدت فقط.";

  let body;

  if (fileBase64) {
    body = {
      contents: [{
        parts: [
          { text: role + " هل هذه الوسائط ضارة رقمياً؟" },
          { inline_data: { mime_type: mimeType, data: fileBase64 } }
        ]
      }]
    };
  } else {
    body = {
      contents: [{
        parts: [{
          text: role + " حلل الرابط التالي أمنياً: " + text
        }]
      }]
    };
  }

  const aiText = await callGemini(apiKey, body);

  const sourceEval = evaluateSource(text);
  const aiEval = analyzeResponse(aiText);

  const finalScore = Math.min(
    100,
    Math.round((sourceEval.score + aiEval.score) / 2)
  );

  let status = "safe";
  if (finalScore >= 70) status = "danger";
  else if (finalScore >= 40) status = "warning";

  return {
    risk_score: finalScore,
    status,
    summary: aiText || "لم يتم اكتشاف تهديدات واضحة",
    technical_details: aiText,
    source: sourceEval.label,
    content_type: fileBase64 ? "image" : "link"
  };
}
