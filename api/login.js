const crypto = require('crypto');

// Pre-hashed credentials (SHA-256)
const ADMIN_USER_HASH = '69ff19dceb46aa62abaa9e0de21072a941a205ed780f3dc5e6b097f35a1979fe';
const ADMIN_PASS_HASH = 'b351e9ffaed3b8e5809cb4b4b488d03f95c3c227dd03d6b3c0dafbc14ad65e7c';

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const { username, password } = body;

        // Compare hashed input against stored hashes
        if (sha256(username) === ADMIN_USER_HASH && sha256(password) === ADMIN_PASS_HASH) {
            return res.status(200).json({ success: true, token: "admin_verified_session" });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (e) {
        return res.status(500).json({ error: "Server error", details: e.message });
    }
};
