const SERVER_URL = "https://cyber-scan.onrender.com";

let currentMode = "text";
let imgBase64 = null;
let lastResult = null;

async function analyze() {
  let payload = {};

  if (currentMode === "image") {
    payload.input = imgBase64;
    payload.type = "image";
  } else {
    payload.input = document.getElementById("textInput").value;
    payload.type = "text";
  }

  document.getElementById("loader").style.display = "block";

  const res = await fetch(`${SERVER_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  lastResult = data;
  showResults(data);

  document.getElementById("loader").style.display = "none";
}

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
