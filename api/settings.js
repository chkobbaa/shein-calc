require('dotenv').config();
const { Redis } = require('@upstash/redis');
const fs = require('fs');
const path = require('path');

// Initialize Redis if env vars are present (handles both Upstash Marketplace and Vercel KV integrations)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const hasRedis = !!(redisUrl && redisToken);

const redis = hasRedis ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

const REDIS_KEY = 'sheinCalc_adminSettings';
const LOCAL_JSON_PATH = path.join(__dirname, '..', 'settings.json');

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            if (hasRedis) {
                const data = await redis.get(REDIS_KEY);
                return res.status(200).json(data || {});
            } else {
                // Fallback to local JSON file for testing locally
                if (fs.existsSync(LOCAL_JSON_PATH)) {
                    const data = fs.readFileSync(LOCAL_JSON_PATH, 'utf8');
                    return res.status(200).json(JSON.parse(data));
                }
                return res.status(200).json({});
            }
        } catch (e) {
            return res.status(500).json({ error: "Failed to get settings", details: e.message });
        }
    } else if (req.method === 'POST') {
        try {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }

            if (hasRedis) {
                await redis.set(REDIS_KEY, body);
            } else {
                fs.writeFileSync(LOCAL_JSON_PATH, JSON.stringify(body, null, 2), 'utf8');
            }
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: "Failed to save settings", details: e.message });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
};
