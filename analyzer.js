import fetch from "node-fetch";

export async function analyzeWithGemini({
    apiKey,
    text,
    fileBase64,
    mimeType,
    lang = "ar"
}) {
    const role = lang === "ar"
        ? "أنت خبير أمن سيبراني وتحليل جنائي رقمي."
        : "You are a cybersecurity expert.";

    let body;

    if (fileBase64) {
        body = {
            contents: [{
                parts: [
                    { text: role + " حلل هذه الوسائط وحدد هل هي آمنة أو خطر أو تزييف." },
                    { inline_data: { mime_type: mimeType, data: fileBase64 } }
                ]
            }]
        };
    } else {
        body = {
            contents: [{
                parts: [{
                    text: `${role} حلل الرابط أو النص التالي وحدد مستوى الخطر: ${text}`
                }]
            }]
        };
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }
    );

    const data = await response.json();

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No result";
}
