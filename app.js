const API_URL = "https://cyber-scan.onrender.com/analyze";

const resultDiv = document.getElementById("result");
const loader = document.getElementById("loader");

function showResult(text, type) {
  resultDiv.className = "result " + type;
  resultDiv.innerText = text;
}

async function analyze() {
  const input = document.getElementById("userInput").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!input) {
    alert("يرجى إدخال رابط أو نص للفحص");
    return;
  }

  if (!apiKey) {
    alert("AIzaSyACPFEb_ndAXgZOsTAqiVkkjTIxjbrpb3g");
    return;
  }

  localStorage.setItem("gemini_key", apiKey);

  loader.style.display = "block";
  resultDiv.innerHTML = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input, apiKey })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    if (data.status === "safe")
      showResult("✅ الرابط أو المحتوى آمن", "safe");
    else if (data.status === "danger")
      showResult("⚠ يوجد خطر محتمل", "danger");
    else
      showResult("⚠ النتيجة غير واضحة", "warn");

  } catch (error) {
    showResult("❌ تعذر الاتصال بالخادم", "danger");
  }

  loader.style.display = "none";
}

document.getElementById("apiKey").value =
  localStorage.getItem("gemini_key") || "";

async function startCamera() {
  const video = document.getElementById("video");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("تعذر تشغيل الكاميرا");
  }
}
