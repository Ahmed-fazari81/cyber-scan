import rateLimit from "express-rate-limit";

// منع هجمات الـ Spam
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 20, // 20 طلب لكل مستخدم في الدقيقة
  message: { error: "لقد تجاوزت الحد المسموح به من الفحوصات، يرجى الانتظار." }
});

// التحقق من حجم ونوع المدخلات
export function validateInput(req, res, next) {
  const { input } = req.body;

  if (!input) return res.status(400).json({ error: "لا يوجد مدخلات للتحليل" });
  
  // حماية السيرفر من الملفات الضخمة (Base64 characters limits)
  if (input.length > 5000000)
    return res.status(400).json({ error: "حجم المدخلات كبير جداً" });

  next();
}
