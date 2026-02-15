const API_URL = "https://cyber-scan.onrender.com/analyze";

const resultDiv = document.getElementById("result");
const reportDiv = document.getElementById("report");
const loader = document.getElementById("loader");

function renderReport(dataText) {
  reportDiv.style.display = "block";
  reportDiv.innerText = dataText;
}

async function analyze() {
  const input = document.getElementById("userInput").value.trim();
  const apiKey = localStorage.getItem("apiKey");

  if (!input) return alert("أدخل محتوى للفحص");
  if (!apiKey) return alert("أدخل API Key من الإعدادات");

  loader.style.display = "block";
  resultDiv.innerHTML = "";
  reportDiv.style.display = "none";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, apiKey })
    });

    const data = await response.json();

    renderReport(data.raw);

    if (data.raw.includes("safe"))
      resultDiv.className = "result safe";
    else if (data.raw.includes("danger"))
      resultDiv.className = "result danger";
    else resultDiv.className = "result warn";

    resultDiv.innerText = "تم إنشاء تقرير التحليل";

  } catch {
    resultDiv.innerText = "فشل الاتصال بالخادم";
  }

  loader.style.display = "none";
}
