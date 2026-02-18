const SERVER_URL = "https://cyber-scan.onrender.com"; // تأكد من أن الرابط صحيح

let currentMode = 'text'; 
let currentImageBase64 = null;
let html5QrCode;

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من المشاركة الخارجية
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text') || params.get('url');
    if (sharedText) {
        document.getElementById('textInput').value = sharedText;
    }
    // التحقق من المفتاح
    if(!localStorage.getItem("apiKey")){
        setTimeout(openSettings, 1000);
    }
});

function switchTab(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.input-group').forEach(g => g.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${mode}`).classList.add('active');
    
    if(mode !== 'qr' && html5QrCode) html5QrCode.stop().catch(()=>{});
}

function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
            currentImageBase64 = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

function startQR() {
    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            document.getElementById("qr-result").innerText = decodedText;
            document.getElementById("textInput").value = decodedText;
            currentMode = 'text';
            html5QrCode.stop();
            if (navigator.vibrate) navigator.vibrate(200);
        },
        () => {}
    ).catch(() => alert("لا يمكن الوصول للكاميرا"));
}

// زر فحص جديد
function resetApp() {
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('textInput').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
    currentImageBase64 = null;
    window.scrollTo(0, 0);
}

async function processAnalysis() {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return openSettings();

    let payload = {};
    if (currentMode === 'text' || currentMode === 'qr') {
        const text = document.getElementById('textInput').value;
        if (!text) return alert("الرجاء إدخال بيانات للفحص");
        payload = { input: text, type: 'text', apiKey };
    } else {
        if (!currentImageBase64) return alert("الرجاء اختيار صورة");
        payload = { input: currentImageBase64, type: 'image', apiKey };
    }

    // إخفاء المدخلات وإظهار التحميل
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('loader').style.display = 'block';

    try {
        const res = await fetch(`${SERVER_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        renderResult(data);

    } catch (error) {
        alert("خطأ في الاتصال بالخادم");
        resetApp(); // العودة للبداية عند الخطأ
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

function renderResult(data) {
    const card = document.getElementById('resultCard');
    const scoreCircle = document.getElementById('scoreCircle');
    const badge = document.getElementById('badgeStatus');

    card.style.display = 'block';
    
    // التعامل مع البيانات المفقودة لتجنب undefined
    const score = data.risk_score || 0;
    const status = data.status || "unknown";
    const summary = data.summary || "لا يوجد ملخص متاح";
    const details = data.technical_details || "لا توجد تفاصيل تقنية";
    const rec = data.recommendation || "توخ الحذر دائماً";

    let color = '#10b981'; // Safe
    if (status === 'suspicious') color = '#f59e0b';
    if (status === 'dangerous') color = '#ef4444';

    const degree = (score / 100) * 360;
    scoreCircle.style.background = `conic-gradient(${color} ${degree}deg, #334155 0deg)`;
    document.getElementById('scoreValue').innerText = score;
    document.getElementById('scoreValue').style.color = color;

    badge.innerText = data.type_detected || "تحليل عام";
    badge.style.background = color;
    
    document.getElementById('resultTitle').innerText = 
        status === 'safe' ? "المحتوى آمن" : 
        status === 'dangerous' ? "خطر مرتفع!" : "محتوى مشبوه";

    document.getElementById('resultSummary').innerText = summary;
    document.getElementById('resultDetails').innerText = details;
    document.getElementById('resultRec').innerText = rec;
}

function openSettings() { document.getElementById('settingsModal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }
function saveKey() {
    const key = document.getElementById('apiKeyInput').value;
    if(key) {
        localStorage.setItem("apiKey", key);
        closeSettings();
        alert("تم حفظ المفتاح ✅");
    }
}
