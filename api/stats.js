const { Redis } = require('@upstash/redis');

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

// Formatting helper
const getDateStr = (d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        return res.status(200).end();
    }

    if (!hasRedis) return res.status(503).json({ error: 'Redis missing' });

    try {
        if (req.method === 'GET') {
            const labels = [];
            const visitKeys = [];
            const uniqueKeys = [];
            
            // Go back 7 days
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const str = getDateStr(d);
                labels.push(str);
                visitKeys.push(`sheinCalc_history_visits:${str}`);
                uniqueKeys.push(`sheinCalc_history_uniques:${str}`);
            }

            // Using mget for atomic retrieval
            const [visitsRow, uniquesRow, totalVisits, totalUniques] = await Promise.all([
                redis.mget(...visitKeys),
                redis.mget(...uniqueKeys),
                redis.get('sheinCalc_total_visits'),
                redis.get('sheinCalc_total_uniques')
            ]);
            
            const mapValues = (arr) => (arr || []).map(v => Number(v) || 0);

            return res.status(200).json({
                labels,
                visits: mapValues(visitsRow),
                uniques: mapValues(uniquesRow),
                totalVisits: Number(totalVisits) || 0,
                totalUniques: Number(totalUniques) || 0
            });
            
        } else if (req.method === 'POST') {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const type = url.searchParams.get('type') || 'return'; // 'new' or 'return'
            
            const todayStr = getDateStr(new Date());
            const visitKey = `sheinCalc_history_visits:${todayStr}`;
            const uniqueKey = `sheinCalc_history_uniques:${todayStr}`;
            
            // Prepare pipeline
            const p = redis.pipeline();
            p.incr('sheinCalc_total_visits');
            p.incr(visitKey);
            p.expire(visitKey, 14 * 24 * 60 * 60); // Store for 14 days then clean
            
            if (type === 'new') {
                p.incr('sheinCalc_total_uniques');
                p.incr(uniqueKey);
                p.expire(uniqueKey, 14 * 24 * 60 * 60);
            }
            
            await p.exec();
            
            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (e) {
        console.error("Redis stats error:", e);
        return res.status(500).json({ error: e.message });
    }
};
