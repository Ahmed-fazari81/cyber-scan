const SERVER_URL = "https://cyber-scan.onrender.com"; // تأكد من الرابط

let currentMode = 'text';
let imgBase64 = null;
let qrScanner = null;

// التحقق من المفتاح عند البدء
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("apiKey")) {
        setTimeout(() => openModal('settingsModal'), 1000);
    }
    // دعم المشاركة من التطبيقات الأخرى
    const params = new URLSearchParams(window.location.search);
    if (params.has('text')) document.getElementById('textInput').value = params.get('text');
});

// إدارة التبويبات (Tabs)
function setMode(mode, btn) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('text-view').style.display = mode === 'text' ? 'block' : 'none';
    document.getElementById('image-view').style.display = mode === 'image' ? 'block' : 'none';
    document.getElementById('qr-view').style.display = mode === 'qr' ? 'block' : 'none';

    if (mode !== 'qr' && qrScanner) qrScanner.stop().catch(()=>{});
}

// معالجة الصور
function handleImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgBase64 = e.target.result;
            document.getElementById('imgPreview').src = imgBase64;
            document.getElementById('imgPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// معالجة QR
function initQR() {
    qrScanner = new Html5Qrcode("qr-reader");
    qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
        (decodedText) => {
            document.getElementById('qr-result').innerText = "تم الرصد: " + decodedText;
            document.getElementById('textInput').value = decodedText; // وضع الرابط في خانة النص
            currentMode = 'text'; // تحويل للوضع النصي للإرسال
            qrScanner.stop();
            analyze(); // بدء التحليل تلقائياً
        },
        () => {}
    );
}

// دالة التحليل الرئيسية
async function analyze() {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return openModal('settingsModal');

    let payload = { apiKey };
    
    if (currentMode === 'image') {
        if (!imgBase64) return alert("اختر صورة أولاً");
        payload.input = imgBase64;
        payload.type = 'image';
    } else {
        const text = document.getElementById('textInput').value;
        if (!text) return alert("أدخل نصاً أو رابطاً");
        payload.input = text;
        payload.type = 'text';
    }

    // UI Loading
    document.getElementById('loader').style.display = 'block';
    document.getElementById('analyzeBtn').disabled = true;

    try {
        const res = await fetch(`${SERVER_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        showResults(data);

    } catch (e) {
        alert("فشل الاتصال بالخادم، حاول مجدداً");
        console.error(e);
    } finally {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('analyzeBtn').disabled = false;
    }
}

// عرض النتائج
function showResults(data) {
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';

    const score = data.risk_score || 0;
    const color = score < 30 ? '#10b981' : score < 70 ? '#f59e0b' : '#ef4444'; // أخضر - برتقالي - أحمر

    document.getElementById('riskScore').innerText = score + "/100";
    document.getElementById('riskScore').style.color = color;
    
    document.getElementById('resStatus').innerText = data.status === 'safe' ? "✅ المحتوى آمن" : "⚠️ تحذير أمني";
    document.getElementById('resStatus').style.color = color;

    document.getElementById('resSummary').innerText = data.summary || "لا يوجد ملخص";
    document.getElementById('resDetails').innerText = data.technical_details || "لا توجد تفاصيل";
    
    // عرض المصدر والنوع (الميزة الجديدة)
    document.getElementById('resSource').innerText = "المصدر: " + (data.source || "غير محدد");
    document.getElementById('resType').innerText = "النوع: " + (data.content_type || "عام");
}

function resetApp() {
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    document.getElementById('textInput').value = '';
    document.getElementById('imgPreview').style.display = 'none';
    imgBase64 = null;
}

// Modals Management
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function saveKey() {
    const key = document.getElementById('apiKey').value;
    if (key) { localStorage.setItem("apiKey", key); closeModal('settingsModal'); alert("تم الحفظ"); }
}
