const { Redis } = require('@upstash/redis');

// Initialize Redis if env vars are present
const getEnv = (suffix) => {
    return process.env[suffix] || process.env[`KV_${suffix}`] || process.env[`configs_KV_${suffix}`] || Object.keys(process.env).find(k => k.endsWith(suffix)) ? process.env[Object.keys(process.env).find(k => k.endsWith(suffix))] : null;
};

const redisUrl = getEnv('REST_API_URL') || getEnv('UPSTASH_REDIS_REST_URL');
const redisToken = getEnv('REST_API_TOKEN') || getEnv('UPSTASH_REDIS_REST_TOKEN');
const hasRedis = !!(redisUrl && redisToken);

const redis = hasRedis ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

const TOTAL_KEY = 'sheinCalc_totalVisitors';

// Helper to get YYYY-MM-DD in UTC
const getTodayKey = () => {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `sheinCalc_visitors_today:${yyyy}-${mm}-${dd}`;
};

module.exports = async function handler(req, res) {
    // Basic CORS for API if needed, though usually accessed from same domain
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        return res.status(200).end();
    }

    if (!hasRedis) {
        return res.status(503).json({ error: 'Redis configuration missing' });
    }

    const TODAY_KEY = getTodayKey();

    try {
        if (req.method === 'GET') {
            const [totalVar, todayVar] = await Promise.all([
                redis.get(TOTAL_KEY),
                redis.get(TODAY_KEY)
            ]);
            
            return res.status(200).json({
                totalVisitors: Number(totalVar) || 0,
                visitorsToday: Number(todayVar) || 0
            });
            
        } else if (req.method === 'POST') {
            // Increment counters atomically
            // INCR automatically sets 1 if key doesn't exist.
            const [newTotal, newToday] = await Promise.all([
                redis.incr(TOTAL_KEY),
                redis.incr(TODAY_KEY)
            ]);
            
            // If it's the first visit of the day, set expiration to 48 hours to clean up Upstash DB
            if (newToday === 1) {
                await redis.expire(TODAY_KEY, 48 * 60 * 60);
            }
            
            return res.status(200).json({
                success: true,
                totalVisitors: newTotal,
                visitorsToday: newToday
            });
            
        } else {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (e) {
        // Fallback or error
        console.error("Redis stats error:", e);
        return res.status(500).json({ error: 'Failed to access stats', details: e.message });
    }
};
