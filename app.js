const API_URL = "https://cybershield-api.onrender.com/analyze";

const resultDiv = document.getElementById("result");
const loader = document.getElementById("loader");

function showResult(text, type) {
  resultDiv.className = "result " + type;
  resultDiv.innerText = text;
}

async function analyze() {
  const input = document.getElementById("userInput").value;
  const apiKey = document.getElementById("apiKey").value;

  if (!apiKey) {
    alert("يرجى إدخال API Key");
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

    const data = await response.json();

    if (data.status === "safe")
      showResult("✅ الرابط آمن", "safe");
    else if (data.status === "danger")
      showResult("⚠ خطر محتمل", "danger");
    else
      showResult("⚠ غير واضح", "warn");

  } catch (error) {
    showResult("حدث خطأ في الاتصال بالخادم", "danger");
  }

  loader.style.display = "none";
}

document.getElementById("apiKey").value =
  localStorage.getItem("gemini_key") || "";

async function startCamera() {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}
