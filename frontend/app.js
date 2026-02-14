let uploadedFileBase64 = null;
let uploadedMimeType = null;
let currentLang = "ar";

function analyzeURLLocally(url) {
    try {
        const u = new URL(url);
        const suspicious = [];

        if (u.hostname.includes("login") || u.hostname.includes("secure"))
            suspicious.push("انتحال محتمل");

        if (url.length > 120)
            suspicious.push("رابط طويل بشكل غير طبيعي");

        if (u.hostname.split(".").length > 3)
            suspicious.push("نطاق فرعي مريب");

        return suspicious;
    } catch {
        return [];
    }
}

async function startScan() {
    const inputVal = document.getElementById("mainInput").value;

    if (!inputVal && !uploadedFileBase64) {
        alert("الرجاء إدخال نص أو ملف");
        return;
    }

    const resultBox = document.getElementById("resultBox");
    const resultDiv = document.getElementById("resultContent");

    resultBox.style.display = "none";

    try {
        const response = await fetch("http://localhost:3000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: uploadedFileBase64 ? null : inputVal,
                fileBase64: uploadedFileBase64,
                mimeType: uploadedMimeType,
                lang: currentLang
            })
        });

        const data = await response.json();
        let resultText = data.result;

        if (!uploadedFileBase64) {
            const localAnalysis = analyzeURLLocally(inputVal);
            if (localAnalysis.length > 0) {
                resultText += "\n\nتحليل محلي:\n" + localAnalysis.join("\n");
            }
        }

        resultDiv.innerText = resultText;
        resultBox.style.display = "block";

    } catch (err) {
        alert("Server Error: " + err.message);
    }
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
