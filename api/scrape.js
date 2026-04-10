const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const { url } = body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        // Optional: Local Windows Chrome fallback for testing
        const getExecutablePath = async () => {
            const fs = require('fs');
            // Common Windows Chrome paths
            const winPaths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
            ];

            for (const p of winPaths) {
                if (fs.existsSync(p)) return p;
            }

            try {
                const path = await chromium.executablePath();
                return path;
            } catch (e) {
                return null;
            }
        };

        const exePath = await getExecutablePath();
        const isLocal = exePath && exePath.includes('Chrome');
        
        console.log("Using executable path:", exePath);

        const browser = await puppeteer.launch({
            args: isLocal ? [] : chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: exePath,
            headless: true,
            ignoreHTTPSErrors: true,
        });


        const page = await browser.newPage();
        
        // Set mobile user agent as Shein sharing links are optimized for mobile
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1');
        
        // Log all responses for backend visibility (optional, keeping minimal)
        page.on('response', async response => {
            if (response.url().includes('cart/share/landing') && response.status() === 200) {
                console.log("Successfully intercepted cart landing API.");
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        // Wait for redirection to complete
        if (page.url().includes('sharejump') || !page.url().includes('group_id')) {
            try {
                await page.waitForFunction(() => window.location.href.includes('group_id'), { timeout: 10000 });
            } catch (e) { /* ignore */ }
        }

        const finalUrl = page.url();
        const groupIdMatch = finalUrl.match(/group_id=([^&]+)/) || finalUrl.match(/groupId=([^&]+)/);
        const groupId = groupIdMatch ? groupIdMatch[1] : null;

        if (!groupId) {
            await browser.close();
            return res.status(404).json({ error: "Could not find cart ID in the link." });
        }

        // Manually trigger the APIs from within the page context to bypass CORS
        // Extract country prefix from the landing URL (e.g. "ar-en" from m.shein.com/ar-en/...)
        const countryPrefix = finalUrl.match(/m\.shein\.com\/([a-z]{2}-[a-z]{2})\//)?.[1] || 'ar-en';

        const extractedData = await page.evaluate(async (gid, prefix) => {
            const commonHeaders = {
                'x-requested-with': 'XMLHttpRequest',
                'appcurrency': 'SAR',
                'applanguage': 'en'
            };
            try {
                // 1. Get Goods Info
                const goodsInfoUrl = `https://m.shein.com/${prefix}/bff-api/social/share/get_cart_goods_info?_ver=1.1.8&_lang=en&localcountry=&groupId=${gid}`;
                const goodsRes = await fetch(goodsInfoUrl, { headers: commonHeaders });
                const goodsData = await goodsRes.json();
                
                const products = goodsData.shareProducts || goodsData.info?.goodsInfo || [];
                if (products.length === 0) return { error: "No products found in this cart." };

                // 2. Get Landing Info (Prices, Names, Images) - must use country prefix for correct currency
                const landingInfoUrl = `https://m.shein.com/${prefix}/bff-api/order/cart/share/landing?_ver=1.1.8&_lang=en`;
                const landRes = await fetch(landingInfoUrl, {
                    method: 'POST',
                    headers: { ...commonHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shareProducts: products, shareUserId: "0", userLocalSizeCountry: "" })
                });
                return await landRes.json();
            } catch (e) {
                return { error: e.message };
            }
        }, groupId, countryPrefix);

        await browser.close();

        if (extractedData.error) {
            return res.status(404).json({ error: extractedData.error });
        }

        const cartData = extractedData;
        if (!cartData?.info?.normalProducts) {
            return res.status(404).json({ error: "Could not retrieve cart data details." });
        }


        const items = cartData.info.normalProducts.map(p => {
            const salePrice = parseFloat(p.salePrice?.amount) || 0;
            const retailPrice = parseFloat(p.retailPrice?.amount) || salePrice;
            const name = p.goods_name || "Unknown Item";
            let image = p.goods_img || "";
            if (image && !image.startsWith('http')) {
                image = 'https:' + image;
            }

            return {
                name,
                image,
                origPrice: retailPrice,
                salePrice: salePrice,
                discount: p.discountSubscript ? (parseInt(p.discountSubscript.value.replace(/[^0-9]/g, '')) || 0) : 0,
                link: `https://www.shein.com/product-p-${p.goods_id}.html`
            };
        });

        return res.status(200).json({ items });


    } catch (error) {
        console.error("Scraper Error:", error);
        return res.status(500).json({ error: "Scraping API Error", details: error.message });
    }
};

