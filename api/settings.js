require('dotenv').config();
const { Redis } = require('@upstash/redis');
const fs = require('fs');
const path = require('path');
// Initialize Redis if env vars are present (handles Vercel KV with 'configs' prefix)
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

const REDIS_KEY = 'sheinCalc_adminSettings';
const LOCAL_JSON_PATH = path.join(__dirname, '..', 'settings.json');

const MODES = ['manual', 'url', 'images'];
const DEFAULT_SETTINGS = {
    'price-mode': 'sale',
    'discount-code': '0',
    'shipping-fee': '0',
    'margin-threshold': '18',
    'margin-low': '2.1',
    'margin-high': '1.7'
};

// Migrate flat (old) format → per-mode format
function ensurePerModeFormat(data) {
    if (!data || typeof data !== 'object') {
        // Return fresh per-mode defaults
        const out = {};
        MODES.forEach(m => out[m] = { ...DEFAULT_SETTINGS });
        return out;
    }
    // Already per-mode if it has at least one mode key
    if (data.manual || data.url || data.images) {
        // Fill any missing modes with defaults
        MODES.forEach(m => {
            if (!data[m]) data[m] = { ...DEFAULT_SETTINGS };
        });
        return data;
    }
    // Old flat format → duplicate across all modes
    const out = {};
    MODES.forEach(m => out[m] = { ...DEFAULT_SETTINGS, ...data });
    return out;
}

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            let data;
            if (hasRedis) {
                data = await redis.get(REDIS_KEY);
            } else {
                // Fallback to local JSON file for testing locally
                if (fs.existsSync(LOCAL_JSON_PATH)) {
                    const raw = fs.readFileSync(LOCAL_JSON_PATH, 'utf8');
                    data = JSON.parse(raw);
                }
            }
            return res.status(200).json(ensurePerModeFormat(data));
        } catch (e) {
            return res.status(500).json({ error: "Failed to get settings", details: e.message });
        }
    } else if (req.method === 'POST') {
        try {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }

            const { mode, settings } = body;

            // Load existing data
            let existing;
            if (hasRedis) {
                existing = await redis.get(REDIS_KEY);
            } else if (fs.existsSync(LOCAL_JSON_PATH)) {
                existing = JSON.parse(fs.readFileSync(LOCAL_JSON_PATH, 'utf8'));
            }
            existing = ensurePerModeFormat(existing);

            if (mode === 'all') {
                // Apply settings to all modes
                MODES.forEach(m => {
                    existing[m] = { ...existing[m], ...settings };
                });
            } else if (MODES.includes(mode)) {
                // Apply to single mode
                existing[mode] = { ...existing[mode], ...settings };
            } else {
                return res.status(400).json({ error: 'Invalid mode. Use: manual, url, images, or all' });
            }

            if (hasRedis) {
                await redis.set(REDIS_KEY, existing);
            } else {
                fs.writeFileSync(LOCAL_JSON_PATH, JSON.stringify(existing, null, 2), 'utf8');
            }
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: "Failed to save settings", details: e.message });
        }
    } else {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
};
