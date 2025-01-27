import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes bekleme süresi
    max: 100, // 100 requests per IP
    message: 'Çok fazla istek yaptınız. Lütfen 5 dakika sonra tekrar deneyiniz.',
});

export default rateLimiter;