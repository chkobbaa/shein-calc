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
        const groupIdMatch =
            finalUrl.match(/[?&]group_id=([^&]+)/) ||
            finalUrl.match(/[?&]groupId=([^&]+)/) ||
            url.match(/[?&]group_id=([^&]+)/) ||
            url.match(/[?&]groupId=([^&]+)/);
        const groupId = groupIdMatch ? groupIdMatch[1] : null;

        if (!groupId) {
            await browser.close();
            return res.status(404).json({ error: "Could not find cart ID in the link." });
        }

        // Manually trigger the APIs from within the page context to bypass CORS.
        // SHEIN locale paths are not always xx-xx; France can be /fr/, while Arabic uses /ar-en/.
        const extractLocalePrefix = (link) => {
            try {
                const { hostname, pathname } = new URL(link);
                const firstSegment = pathname.split('/').filter(Boolean)[0];
                if (/^[a-z]{2}(?:-[a-z]{2})?$/i.test(firstSegment)) return firstSegment.toLowerCase();

                const hostPrefix = hostname.split('.')[0];
                if (/^[a-z]{2}$/i.test(hostPrefix) && hostPrefix !== 'm') return hostPrefix.toLowerCase();
                if (hostname === 'shein.fr' || hostname.endsWith('.shein.fr')) return 'fr';

                return null;
            } catch (e) {
                return null;
            }
        };

        const countryPrefixes = [...new Set([
            extractLocalePrefix(finalUrl),
            extractLocalePrefix(url),
            'fr',
            'fr-fr',
            'ar-en'
        ].filter(Boolean))];

        const extractedData = await page.evaluate(async (gid, prefixes) => {
            const SAUDI_PREFIX = 'ar-en';
            const commonHeaders = {
                'x-requested-with': 'XMLHttpRequest',
                'appcurrency': 'SAR',
                'applanguage': 'en'
            };

            const readJson = async (response) => {
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return { error: text || response.statusText };
                }
            };

            try {
                const attempts = [];
                let products = [];
                let sourcePrefix = null;

                for (const prefix of prefixes) {
                    // 1. Get cart goods from whichever region owns the shared link.
                    const goodsInfoUrl = `https://m.shein.com/${prefix}/bff-api/social/share/get_cart_goods_info?_ver=1.1.8&_lang=en&localcountry=&groupId=${encodeURIComponent(gid)}`;
                    const goodsRes = await fetch(goodsInfoUrl, { headers: commonHeaders });
                    const goodsData = await readJson(goodsRes);

                    products = goodsData.shareProducts || goodsData.info?.goodsInfo || [];
                    attempts.push({ prefix, status: goodsRes.status, productCount: products.length });
                    if (products.length > 0) {
                        sourcePrefix = prefix;
                        break;
                    }
                }

                if (products.length === 0) {
                    return { error: "No products found in this cart.", attempts };
                }

                const pricingPrefixes = [...new Set([SAUDI_PREFIX, sourcePrefix, ...prefixes].filter(Boolean))];

                for (const prefix of pricingPrefixes) {
                    // 2. Price the extracted products. Saudi pricing is tried first because orders are bought there.
                    const landingInfoUrl = `https://m.shein.com/${prefix}/bff-api/order/cart/share/landing?_ver=1.1.8&_lang=en`;
                    const landRes = await fetch(landingInfoUrl, {
                        method: 'POST',
                        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shareProducts: products, shareUserId: "0", userLocalSizeCountry: "" })
                    });
                    const landingData = await readJson(landRes);
                    if (landingData?.info?.normalProducts?.length) {
                        landingData.__sheinLocalePrefix = prefix;
                        landingData.__sourceLocalePrefix = sourcePrefix;
                        return landingData;
                    }

                    attempts.push({
                        pricingPrefix: prefix,
                        landingStatus: landRes.status,
                        landingProductCount: landingData?.info?.normalProducts?.length || 0
                    });
                }

                return { error: "No products found in this cart.", attempts };
            } catch (e) {
                return { error: e.message };
            }
        }, groupId, countryPrefixes);

        await browser.close();

        if (extractedData.error) {
            return res.status(404).json({ error: extractedData.error });
        }

        const cartData = extractedData;
        if (!cartData?.info?.normalProducts) {
            return res.status(404).json({ error: "Could not retrieve cart data details." });
        }

        const localePrefix = cartData.__sheinLocalePrefix || countryPrefixes[0] || 'ar-en';

        const inferCurrency = (price, prefix) => {
            const text = [
                price?.currency,
                price?.currencyCode,
                price?.unit,
                price?.amountWithSymbol
            ].filter(Boolean).join(' ');

            if (/\bEUR\b|€/.test(text)) return 'EUR';
            if (/\bUSD\b|\$/.test(text)) return 'USD';
            if (/\bGBP\b|£/.test(text)) return 'GBP';
            if (/\bAED\b/.test(text)) return 'AED';
            if (/\bDZD\b|\bDA\b/.test(text)) return 'DZD';
            if (/\bMAD\b/.test(text)) return 'MAD';
            if (/\bTND\b|\bDT\b/.test(text)) return 'TND';
            if (prefix === 'fr' || prefix === 'fr-fr') return 'EUR';
            return 'SAR';
        };

        const sourceCurrency = inferCurrency(
            cartData.info.normalProducts.find(p => p.salePrice || p.retailPrice)?.salePrice ||
            cartData.info.normalProducts.find(p => p.salePrice || p.retailPrice)?.retailPrice,
            localePrefix
        );

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
                link: `https://m.shein.com/${localePrefix}/product-p-${p.goods_id}.html`
            };
        });

        return res.status(200).json({ items, sourceCurrency });


    } catch (error) {
        console.error("Scraper Error:", error);
        return res.status(500).json({ error: "Scraping API Error", details: error.message });
    }
};
