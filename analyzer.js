import fetch from "node-fetch";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function analyzeContent({
  apiKey,
  input,
  type = "text",
  mimeType = "image/jpeg"
}) {
  const systemPrompt = `
أنت محرك تحليل أمني سيبراني احترافي.
أعد النتيجة بصيغة JSON فقط.

{
  "status": "safe" | "suspicious" | "dangerous",
  "risk_score": رقم من 0 إلى 100,
  "source": "اسم المصدر",
  "content_type": "Phishing | Deepfake | Scam | Safe",
  "summary": "وصف عربي واضح",
  "technical_details": "سبب تقني",
  "recommendation": "إجراء أمني"
}
`;

  let body;

  if (type === "image") {
    const base64Data = input.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      ""
    );

    body = {
      contents: [{
        parts: [
          { text: systemPrompt + "\nحلل هذه الصورة أمنياً:" },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }]
    };
  } else {
    body = {
      contents: [{
        parts: [{ text: systemPrompt + `\nالمدخل: "${input}"` }]
      }]
    };
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    let rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    rawText = rawText.replace(/```json/g, "").replace(/```/g, "");

    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      rawText = rawText.substring(start, end + 1);
    }

    return JSON.parse(rawText);

  } catch (error) {
    return fallbackAnalysis(input);
  }
}

function fallbackAnalysis(input) {
  let status = "suspicious";
  if (input.includes("http:")) status = "suspicious";
  if (input.includes("login") || input.includes("bank"))
    status = "dangerous";

  return {
    status,
    risk_score: status === "dangerous" ? 85 : 55,
    source: "Fallback Engine",
    content_type: "Unknown",
    summary: "تم اكتشاف مؤشرات خطر محتملة.",
    technical_details: "تحليل احتياطي.",
    recommendation: "تجنب التفاعل مع المحتوى."
  };
}
