const SERVER_URL = "https://cyber-scan.onrender.com";

let currentMode = "text";
let imgBase64 = null;
let qrScanner = null;
let lastResult = null;

/* تشغيل التطبيق */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("text"))
    document.getElementById("textInput").value = params.get("text");
});

/* إدارة التبويبات */
function setMode(mode, btn) {
  currentMode = mode;

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.remove("active")
  );
  btn.classList.add("active");

  document.getElementById("text-view").style.display =
    mode === "text" ? "block" : "none";

  document.getElementById("image-view").style.display =
    mode === "image" ? "block" : "none";

  document.getElementById("qr-view").style.display =
    mode === "qr" ? "block" : "none";

  if (mode !== "qr" && qrScanner)
    qrScanner.stop().catch(() => {});
}

/* رفع صورة */
function handleImage(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    imgBase64 = e.target.result;
    document.getElementById("imgPreview").src = imgBase64;
    document.getElementById("imgPreview").style.display = "block";
  };
  reader.readAsDataURL(file);
}

/* تحليل المحتوى */
async function analyze() {
  let payload = {};

  if (currentMode === "image") {
    if (!imgBase64) return alert("اختر صورة أولاً");
    payload.input = imgBase64;
    payload.type = "image";
  } else {
    const text = document.getElementById("textInput").value;
    if (!text) return alert("أدخل رابطاً أو نصاً");
    payload.input = text;
    payload.type = "text";
  }

  document.getElementById("loader").style.display = "block";
  document.getElementById("analyzeBtn").disabled = true;

  try {
    const res = await fetch(`${SERVER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    lastResult = data;
    showResults(data);

  } catch (e) {
    alert("فشل الاتصال بالخادم");
    console.error(e);
  }

  document.getElementById("loader").style.display = "none";
  document.getElementById("analyzeBtn").disabled = false;
}

/* عرض النتائج */
function showResults(data) {
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  const score = data.risk_score || 0;
  const color =
    score < 30 ? "#10b981" :
    score < 70 ? "#f59e0b" :
    "#ef4444";

  document.getElementById("riskScore").innerText = score + "/100";
  document.getElementById("riskScore").style.color = color;

  document.getElementById("resStatus").innerText =
    data.status === "safe"
      ? "✅ المحتوى آمن"
      : "⚠️ تحذير أمني";

  document.getElementById("resStatus").style.color = color;
  document.getElementById("resSummary").innerText = data.summary || "";
  document.getElementById("resDetails").innerText =
    data.technical_details || "";

  document.getElementById("resSource").innerText =
    "المصدر: " + (data.source || "غير محدد");

  document.getElementById("resType").innerText =
    "النوع: " + (data.content_type || "عام");
}

/* تحميل التقرير */
async function downloadReport() {
  if (!lastResult) return;

  const res = await fetch(`${SERVER_URL}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lastResult)
  });

  const text = await res.text();
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cyber-report.txt";
  a.click();
}

/* إعادة التطبيق */
function resetApp() {
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("mainSection").style.display = "block";
  document.getElementById("textInput").value = "";
  document.getElementById("imgPreview").style.display = "none";
  imgBase64 = null;
}

/* إدارة النوافذ */
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
