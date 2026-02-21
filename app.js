const SERVER_URL = "https://cyber-scan.onrender.com";

let currentMode="text";
let imgBase64=null;
let lastResult=null;
let progressInterval;

/* تبديل الوضع */
function setMode(mode,btn){
currentMode=mode;
document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
btn.classList.add("active");
document.getElementById("text-view").style.display=mode==="text"?"block":"none";
document.getElementById("image-view").style.display=mode==="image"?"block":"none";
}

/* رفع صورة */
function handleImage(input){
const file=input.files[0];
if(!file)return;
const reader=new FileReader();
reader.onload=e=>{
imgBase64=e.target.result;
document.getElementById("imgPreview").src=imgBase64;
document.getElementById("imgPreview").style.display="block";
};
reader.readAsDataURL(file);
}

/* تحليل */
async function analyze(){
let payload={};

if(currentMode==="image"){
if(!imgBase64)return alert("اختر صورة أولاً");
payload.input=imgBase64;
payload.type="image";
}else{
const text=document.getElementById("textInput").value;
if(!text)return alert("أدخل رابطاً أو نصاً");
payload.input=text;
payload.type="text";
}

startProgress();

try{
const res=await fetch(`${SERVER_URL}/analyze`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(payload)
});

const data=await res.json();
lastResult=data;
showResults(data);
saveHistory(payload.input,data);

}catch(e){
alert("فشل الاتصال بالخادم");
}

stopProgress();
}

/* عرض النتائج */
function showResults(data){
document.getElementById("mainSection").style.display="none";
document.getElementById("resultSection").style.display="block";

const score=data.risk_score||0;
document.getElementById("riskScore").innerText=score+"/100";

let status="آمن";
let reason="لم يتم اكتشاف تهديدات";

if(score>=70){
status="تحذير أمني";
reason="تم رصد مؤشرات قوية على الاحتيال أو التزييف.";
}
else if(score>=40){
status="حذر";
reason="تم اكتشاف إشارات تحتاج إلى الحذر.";
}

document.getElementById("resStatus").innerText=status;
document.getElementById("resSummary").innerText=data.summary||"";
document.getElementById("resDetails").innerText=data.technical_details||"";
document.getElementById("decisionReason").innerText=reason;

const confidence=Math.max(55,100-score)+"%";
document.getElementById("confidence").innerText=confidence;

renderHistory();
}

/* شريط التقدم */
function startProgress(){
document.getElementById("progressWrap").style.display="block";
const bar=document.getElementById("progressBar");
let value=10;
progressInterval=setInterval(()=>{
value+=Math.random()*15;
if(value>=90)value=90;
bar.style.width=value+"%";
},400);
}

function stopProgress(){
clearInterval(progressInterval);
document.getElementById("progressBar").style.width="100%";
setTimeout(()=>{
document.getElementById("progressWrap").style.display="none";
document.getElementById("progressBar").style.width="0%";
},700);
}

/* التقرير */
async function downloadReport(){
const res=await fetch(`${SERVER_URL}/report`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(lastResult)
});
const text=await res.text();
const blob=new Blob([text]);
const url=URL.createObjectURL(blob);
const a=document.createElement("a");
a.href=url;
a.download="cyber-report.txt";
a.click();
}

/* مشاركة واتساب */
function shareWhatsApp(){
const text=`نتيجة الفحص الأمني: ${lastResult.risk_score}/100`;
window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

/* سجل الفحوصات */
function saveHistory(input,result){
let history=JSON.parse(localStorage.getItem("scanHistory")||"[]");
history.unshift({input,score:result.risk_score});
history=history.slice(0,5);
localStorage.setItem("scanHistory",JSON.stringify(history));
}

function renderHistory(){
const history=JSON.parse(localStorage.getItem("scanHistory")||"[]");
const box=document.getElementById("historyBox");
box.innerHTML="<strong>آخر الفحوصات:</strong><br>"+history.map(h=>`• ${h.score}/100`).join("<br>");
}

/* إعادة */
function resetApp(){
document.getElementById("resultSection").style.display="none";
document.getElementById("mainSection").style.display="block";
}
