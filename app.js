const SERVER_URL = "https://cyber-scan.onrender.com";

let currentMode = "text";
let imgBase64 = null;
let lastResult = null;
let progressInterval;

/* تبديل الوضع */
function setMode(mode, btn) {
  currentMode = mode;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("text-view").style.display = mode === "text" ? "block" : "none";
  document.getElementById("image-view").style.display = mode === "image" ? "block" : "none";
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

/* التحليل والاتصال بالخادم */
async function analyze() {
  let payload = {};

  if (currentMode === "image") {
    if (!imgBase64) return alert("الرجاء اختيار صورة أولاً");
    payload.input = imgBase64;
    payload.type = "image";
  } else {
    const text = document.getElementById("textInput").value.trim();
    if (!text) return alert("الرجاء إدخال رابط أو نص");
    payload.input = text;
    payload.type = "text";
  }

  startProgress();

  try {
    const res = await fetch(`${SERVER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Server Error");

    const data = await res.json();
    lastResult = data;
    stopProgress();
    setTimeout(() => {
      showResults(data);
      saveHistory(payload.input, data);
    }, 800);

  } catch (e) {
    stopProgress();
    setTimeout(() => {
      alert("فشل الاتصال بالخادم، يرجى المحاولة لاحقاً.");
    }, 500);
  }
}

/* عرض النتائج */
function showResults(data) {
  document.getElementById("mainSection").style.display = "none";
  document.getElementById("resultSection").style.display = "block";

  const score = data.risk_score || 0;
  document.getElementById("riskScore").innerText = score + "/100";

  let status = "آمن";
  let reason = "لم يتم اكتشاف أي تهديدات رقمية.";

  if (score >= 70) {
    status = "تحذير أمني";
    reason = "تم رصد مؤشرات قوية على وجود محتوى ضار أو احتيالي.";
  } else if (score >= 40) {
    status = "حذر";
    reason = "تم اكتشاف إشارات تستدعي الحذر قبل التعامل مع المحتوى.";
  }

  document.getElementById("resStatus").innerText = status;
  document.getElementById("resSummary").innerText = data.summary || "";
  document.getElementById("resDetails").innerText = data.technical_details || "";
  document.getElementById("decisionReason").innerText = reason;

  const confidence = Math.max(55, 100 - score) + "%";
  document.getElementById("confidence").innerText = confidence;

  renderHistory();
}

/* شريط التقدم */
function startProgress() {
  document.getElementById("progressWrap").style.display = "block";
  const bar = document.getElementById("progressBar");
  bar.style.width = "0%";
  let value = 10;
  progressInterval = setInterval(() => {
    value += Math.random() * 15;
    if (value >= 90) value = 90;
    bar.style.width = value + "%";
  }, 400);
}

function stopProgress() {
  clearInterval(progressInterval);
  document.getElementById("progressBar").style.width = "100%";
  setTimeout(() => {
    document.getElementById("progressWrap").style.display = "none";
  }, 700);
}

/* التقرير (يتم توليده في المتصفح الآن لسرعة الأداء) */
function downloadReport() {
  if (!lastResult) return;
  const data = lastResult;
  
  const reportText = `تقرير أمني - CyberShield\n\nتاريخ الفحص: ${new Date().toLocaleString('ar-EG')}
الحالة: ${data.status}
درجة الخطورة: ${data.risk_score}/100
النوع: ${data.content_type}

الملخص:
${data.summary}

التفاصيل التقنية:
${data.technical_details}
`;

  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cybershield-report.txt";
  a.click();
  URL.revokeObjectURL(url);
}

/* مشاركة واتساب */
function shareWhatsApp() {
  if(!lastResult) return;
  const text = `استخدمت تطبيق CyberShield لفحص رابط/محتوى وكانت نتيجة الخطر: ${lastResult.risk_score}/100 🛡️`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

/* سجل الفحوصات */
function saveHistory(input, result) {
  let history = JSON.parse(localStorage.getItem("scanHistory") || "[]");
  history.unshift({ score: result.risk_score, date: new Date().toLocaleDateString('ar-EG') });
  history = history.slice(0, 5); // الاحتفاظ بآخر 5 فحوصات فقط
  localStorage.setItem("scanHistory", JSON.stringify(history));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("scanHistory") || "[]");
  const box = document.getElementById("historyBox");
  if(history.length === 0) return;
  box.innerHTML = "<strong>سجل آخر الفحوصات:</strong><br>" + history.map(h => `• خطر: ${h.score}% (${h.date})`).join("<br>");
}

/* فحص جديد */
function resetApp() {
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("mainSection").style.display = "block";
  document.getElementById("textInput").value = "";
  document.getElementById("imgPreview").style.display = "none";
  imgBase64 = null;
}
