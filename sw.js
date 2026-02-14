const CACHE_NAME = 'cybershield-cache-v3'; // قمت بتحديث الإصدار لضمان تحديث الملفات

// قائمة الملفات التي سيتم تخزينها ليعمل التطبيق وتظهر الواجهة
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    
    // تخزين المكتبات الخارجية لضمان ظهور الأيقونات والخطوط حتى مع نت بطيء
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/html5-qrcode',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Segoe+UI&display=swap'
];

// 1. تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
    // تخطي الانتظار لتفعيل التحديث فوراً
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS);
        })
    );
});

// 2. تفعيل Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // جعل الخدمة تسيطر على الصفحة فوراً
    return self.clients.claim();
});

// 3. استراتيجية الجلب: (Network First, falling back to Cache)
// حاول الاتصال بالنت أولاً (لجلب أحدث نسخة)، إذا فشل، استخدم الكاش.
self.addEventListener('fetch', (event) => {
    // استثناء طلبات API الخاصة بـ Gemini من الكاش (لأنها يجب أن تكون مباشرة)
    if (event.request.url.includes('generativelanguage.googleapis.com')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // إذا نجح الاتصال بالنت، قم بتحديث الكاش بهذه النسخة الجديدة
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // إذا فشل النت، ارجع للكاش
                return caches.match(event.request);
            })
    );
});
