// URL الخادم (يتم استبداله برابط Render الخاص بك)
// تأكد من أن رابط الخادم لا ينتهي بـ /
const SERVER_URL = "https://cyber-scan.onrender.com"; 

let currentMode = 'text'; // text, image, qr
let currentImageBase64 = null;
let html5QrCode;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من المشاركة عبر واتساب (Share Target)
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text') || params.get('url') || params.get('title');
    
    if (sharedText) {
        document.getElementById('textInput').value = sharedText;
        switchTab('text');
    }

    // التحقق من المفتاح
    if(!localStorage.getItem("apiKey")){
        openSettings();
    }
});

function switchTab(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.input-group').forEach(g => g.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${mode}`).classList.add('active');

    // إيقاف الكاميرا إذا تم تغيير التبويب
    if(mode !== 'qr' && html5QrCode) {
        html5QrCode.stop().catch(()=>{});
    }
}

// معالجة الصور
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

// معالجة QR Code
function startQR() {
    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            // Success
            document.getElementById("qr-result").innerText = decodedText;
            document.getElementById("textInput").value = decodedText; // نضع القيمة في النص للتحليل
            currentMode = 'text'; // نحول الوضع لنص لأننا استخرجنا الرابط
            html5QrCode.stop();
            // تشغيل هزاز الهاتف للمتعة
            if (navigator.vibrate) navigator.vibrate(200);
        },
        (errorMessage) => {
            // Error scanning
        }
    ).catch(err => {
        alert("لا يمكن الوصول للكاميرا");
    });
}

// دالة التحليل الرئيسية
async function processAnalysis() {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return openSettings();

    let payload = {};
    
    if (currentMode === 'text' || currentMode === 'qr') {
        const text = document.getElementById('textInput').value;
        if (!text) return alert("الرجاء إدخال نص أو رابط");
        payload = { input: text, type: 'text', apiKey };
    } 
    else if (currentMode === 'image') {
        if (!currentImageBase64) return alert("الرجاء اختيار صورة");
        payload = { input: currentImageBase64, type: 'image', apiKey };
    }

    // واجهة المستخدم
    document.getElementById('loader').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = true;

    try {
        const res = await fetch(`${SERVER_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        renderResult(data);

    } catch (error) {
        alert("حدث خطأ في الاتصال بالخادم");
        console.error(error);
    } finally {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('analyzeBtn').disabled = false;
    }
}

function renderResult(data) {
    const card = document.getElementById('resultCard');
    const scoreCircle = document.getElementById('scoreCircle');
    const badge = document.getElementById('badgeStatus');

    card.style.display = 'block';
    
    // الألوان
    let color = '#10b981'; // Safe
    if (data.status === 'suspicious') color = '#f59e0b';
    if (data.status === 'dangerous') color = '#ef4444';

    // تحديث الدائرة البيانية
    const degree = (data.risk_score / 100) * 360;
    scoreCircle.style.background = `conic-gradient(${color} ${degree}deg, #334155 0deg)`;
    document.getElementById('scoreValue').innerText = data.risk_score;
    document.getElementById('scoreValue').style.color = color;

    // النصوص
    badge.innerText = data.type_detected || data.status;
    badge.style.background = color;
    
    document.getElementById('resultTitle').innerText = 
        data.status === 'safe' ? "المحتوى يبدو آمناً" : 
        data.status === 'dangerous' ? "تهديد أمني مكتشف!" : "محتوى مشبوه";

    document.getElementById('resultSummary').innerText = data.summary;
    document.getElementById('resultDetails').innerText = data.technical_details;
    document.getElementById('resultRec').innerText = data.recommendation;
}

// إعدادات المفتاح
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
