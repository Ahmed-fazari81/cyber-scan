const CACHE_NAME = "cybershield-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// تنصيب وتخزين الملفات الجديدة
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// مسح الكاش القديم عند تفعيل النسخة الجديدة لضمان وصول التحديث للمستخدم
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// جلب الملفات
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      // إرجاع الملف من الكاش إن وجد، أو جلبه من الإنترنت
      return res || fetch(e.request);
    })
  );
});
