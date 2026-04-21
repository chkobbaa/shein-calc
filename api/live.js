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

const LIVE_SET = 'sheinCalc_live_users';
const TIMEOUT_MS = 12000; // 12 seconds cutoff

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        return res.status(200).end();
    }

    if (!hasRedis || req.method !== 'POST') {
        return res.status(hasRedis ? 405 : 503).end();
    }

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const uuid = url.searchParams.get('uuid');
        const action = url.searchParams.get('action');
        
        if (!uuid) return res.status(400).json({ error: 'Missing UUID' });
        
        const now = Date.now();
        
        if (action === 'leave') {
            await redis.zrem(LIVE_SET, uuid);
        } else {
            // Upsert user into sorted set with current timestamp as score
            await redis.zadd(LIVE_SET, { score: now, member: uuid });
        }
        
        // Remove users who haven't pinged in TIMEOUT_MS
        const threshold = now - TIMEOUT_MS;
        await redis.zremrangebyscore(LIVE_SET, 0, threshold);
        
        // Get remaining active count
        const count = await redis.zcard(LIVE_SET);
        
        return res.status(200).json({ live: count });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
