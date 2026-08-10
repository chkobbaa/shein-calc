const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const SAUDI_HOST = 'https://ar.shein.com';
const SAUDI_MOBILE_PREFIX = 'ar-en';

module.exports = async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const isStream = req.method === 'GET' && req.query?.stream === '1';
    const sendProgress = (payload) => {
        if (!isStream) return;
        res.write(`event: progress\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    const sendStreamResult = (payload) => {
        res.write(`event: result\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        res.end();
    };
    const sendStreamError = (status, payload) => {
        res.write(`event: fail\n`);
        res.write(`data: ${JSON.stringify({ status, ...payload })}\n\n`);
        res.end();
    };

    try {
        if (isStream) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive'
            });
        }

        let body = req.method === 'GET' ? req.query : req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const { url } = body;
        if (!url) {
            if (isStream) return sendStreamError(400, { error: 'URL is required' });
            return res.status(400).json({ error: 'URL is required' });
        }

        sendProgress({ stage: 'launch', message: 'Starting browser...', processed: 0, total: 0 });

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

        sendProgress({ stage: 'cart', message: 'Opening shared cart...', processed: 0, total: 0 });
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
            finalUrl.match(/[?&]shc=([^&]+)/) ||
            url.match(/[?&]group_id=([^&]+)/) ||
            url.match(/[?&]groupId=([^&]+)/) ||
            url.match(/[?&]shc=([^&]+)/);
        const groupId = groupIdMatch ? groupIdMatch[1] : null;

        if (!groupId) {
            await browser.close();
            if (isStream) return sendStreamError(404, { error: "Could not find cart ID in the link." });
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
            'ar-en',
            'us',
            'es',
            'en',
            'it',
            'de',
            'eur',
            'gb',
            'ar',
            'ca',
            'au'
        ].filter(Boolean))];

        sendProgress({ stage: 'cart', message: 'Reading cart items...', processed: 0, total: 0 });
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

                // If landing API fails to price them, fallback to the goods we already found
                if (products.length > 0) {
                    return {
                        info: { normalProducts: products },
                        __sheinLocalePrefix: sourcePrefix,
                        __sourceLocalePrefix: sourcePrefix
                    };
                }

                return { error: "No products found in this cart.", attempts };
            } catch (e) {
                return { error: e.message };
            }
        }, groupId, countryPrefixes);

        if (extractedData.error) {
            await browser.close();
            if (isStream) return sendStreamError(404, { error: extractedData.error });
            return res.status(404).json({ error: extractedData.error });
        }

        const cartData = extractedData;
        if (!cartData?.info?.normalProducts) {
            await browser.close();
            if (isStream) return sendStreamError(404, { error: "Could not retrieve cart data details." });
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

        const findSku = (value, depth = 0, isPreferred = false) => {
            if (!value || depth > 5) return null;
            if (typeof value === 'string') {
                const clean = value.trim();
                if (isPreferred && /^[a-zA-Z0-9_-]{6,25}$/.test(clean)) return clean;
                const match = clean.match(/\b[a-zA-Z0-9_-]{8,25}\b/);
                return match ? match[0] : null;
            }
            if (Array.isArray(value)) {
                for (const item of value) {
                    const found = findSku(item, depth + 1, isPreferred);
                    if (found) return found;
                }
                return null;
            }
            if (typeof value === 'object') {
                const preferredKeys = ['skc', 'goods_sn', 'goodsSn', 'goods_sn_origin', 'goodsSnOrigin', 'sku', 'skuCode', 'productRelationID'];
                for (const key of preferredKeys) {
                    if (value[key] !== undefined) {
                        const found = findSku(value[key], depth + 1, true);
                        if (found) return found;
                    }
                }
                for (const item of Object.values(value)) {
                    const found = findSku(item, depth + 1, false);
                    if (found) return found;
                }
            }
            return null;
        };

        const makeAbsoluteImage = (image) => {
            if (!image) return "";
            if (image.startsWith('http')) return image;
            if (image.startsWith('//')) return `https:${image}`;
            return image;
        };

        const parseAmount = (value) => {
            if (typeof value === 'number') return value;
            if (!value) return 0;
            const match = String(value).replace(/\s/g, '').match(/(\d+(?:[.,]\d{1,2})?)/);
            return match ? parseFloat(match[1].replace(',', '.')) : 0;
        };

        const extractFallbackItem = (p) => {
            const salePrice = parseFloat(p.salePrice?.amount) || 0;
            const retailPrice = parseFloat(p.retailPrice?.amount) || salePrice;
            const name = p.goods_name || "Unknown Item";
            const image = makeAbsoluteImage(p.goods_img || "");
            const sku = findSku(p);

            return {
                name,
                image,
                origPrice: retailPrice,
                salePrice: salePrice,
                discount: p.discountSubscript ? (parseInt(p.discountSubscript.value.replace(/[^0-9]/g, '')) || 0) : 0,
                link: `https://m.shein.com/${localePrefix}/product-p-${p.goods_id}.html`,
                sku,
                priceSource: 'cart'
            };
        };

        const searchSaudiBySku = async (searchPage, sku) => {
            if (!sku) return null;

            try {
                await searchPage.evaluate((searchSku) => {
                    const input = document.querySelector('input[type="search"], input[placeholder], .j-header-search-input, input');
                    if (!input) throw new Error('Could not find SHEIN search input.');
                    input.focus();
                    input.value = searchSku;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
                }, sku);

                try {
                    await searchPage.waitForFunction(() => {
                        const text = document.body.innerText || "";
                        return location.href.includes('/pdsearch/') && /\d+[.,]\d{2}/.test(text);
                    }, { timeout: 12000 });
                } catch (e) { /* continue and inspect whatever rendered */ }

                return await searchPage.evaluate((searchSku) => {
                    const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();
                    const amountFromText = (text) => {
                        const lines = (text || '').split(/\n+/).map(clean).filter(Boolean);
                        const priceLine = lines.find(line => /(?:SAR|SR|ر\.س|﷼|)\s*\d+[.,]\d{2}|\d+[.,]\d{2}/i.test(line));
                        if (!priceLine) return 0;
                        const match = priceLine.match(/(\d+(?:[.,]\d{2}))/);
                        return match ? parseFloat(match[1].replace(',', '.')) : 0;
                    };
                    const bestImage = (root) => {
                        const img = root.querySelector('img');
                        if (!img) return "";
                        return img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || "";
                    };
                    const bestName = (root) => {
                        const lines = (root.innerText || '').split(/\n+/).map(clean).filter(Boolean);
                        return lines.find(line => {
                            if (line.length < 12) return false;
                            if (line === searchSku) return false;
                            if (/^(SAR|SR|ر\.س|﷼|)?\s*\d+[.,]\d{2}$/i.test(line)) return false;
                            if (/^\d+\+?/.test(line)) return false;
                            return true;
                        }) || "";
                    };

                    const anchors = Array.from(document.querySelectorAll('a[href*="product-p-"], a[href*="-p-"]'));
                    for (const anchor of anchors) {
                        const href = anchor.href || "";
                        const goodsId = href.match(/(?:product-)?p-(\d+)/)?.[1];
                        if (!goodsId) continue;

                        let root = anchor;
                        for (let i = 0; i < 6 && root.parentElement; i++) {
                            root = root.parentElement;
                            if (amountFromText(root.innerText) && bestImage(root)) break;
                        }

                        const salePrice = amountFromText(root.innerText || anchor.innerText);
                        if (!salePrice) continue;

                        return {
                            name: bestName(root) || bestName(anchor),
                            image: bestImage(root) || bestImage(anchor),
                            salePrice,
                            origPrice: salePrice,
                            discount: 0,
                            link: `${location.origin}/product-p-${goodsId}.html`,
                            sku: searchSku,
                            priceSource: 'saudi-sku-search'
                        };
                    }

                    const text = document.body.innerText || "";
                    const salePrice = amountFromText(text);
                    const productId = text.match(/product_id["']?\s*[:=]\s*["']?(\d+)/i)?.[1];
                    if (salePrice && productId) {
                        return {
                            name: "",
                            image: "",
                            salePrice,
                            origPrice: salePrice,
                            discount: 0,
                            link: `${location.origin}/product-p-${productId}.html`,
                            sku: searchSku,
                            priceSource: 'saudi-sku-search'
                        };
                    }

                    return null;
                }, sku);
            } catch (e) {
                console.warn(`Saudi SKU search failed for ${sku}:`, e.message);
                return null;
            }
        };

        const sourceProducts = cartData.info.normalProducts;
        const fallbackItems = sourceProducts.map(extractFallbackItem);
        let searchPage = null;
        const items = [];
        sendProgress({
            stage: 'sku',
            message: `Found ${fallbackItems.length} cart item(s). Searching Saudi SHEIN by SKU...`,
            processed: 0,
            total: fallbackItems.length
        });

        try {
            searchPage = await browser.newPage();
            await searchPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36');
            await searchPage.setViewport({ width: 1280, height: 900 });
            await searchPage.setRequestInterception(true);
            searchPage.on('request', request => {
                const type = request.resourceType();
                if (['font', 'media'].includes(type)) return request.abort();
                return request.continue();
            });
            await searchPage.goto(SAUDI_HOST, { waitUntil: 'domcontentloaded', timeout: 45000 });

            for (let i = 0; i < fallbackItems.length; i++) {
                const fallback = fallbackItems[i];
                sendProgress({
                    stage: 'sku',
                    message: fallback.sku ? `Searching Saudi SKU ${fallback.sku}...` : 'No SKU found; using cart fallback...',
                    processed: i,
                    total: fallbackItems.length,
                    currentSku: fallback.sku || null
                });
                const saudiItem = fallback.sku ? await searchSaudiBySku(searchPage, fallback.sku) : null;
                items.push({
                    ...fallback,
                    ...(saudiItem || {}),
                    name: saudiItem?.name || fallback.name,
                    image: makeAbsoluteImage(saudiItem?.image || fallback.image),
                    link: saudiItem?.link || fallback.link
                });
                sendProgress({
                    stage: 'sku',
                    message: saudiItem ? `Priced ${i + 1} of ${fallbackItems.length} from Saudi SHEIN.` : `Used fallback for ${i + 1} of ${fallbackItems.length}.`,
                    processed: i + 1,
                    total: fallbackItems.length,
                    currentSku: fallback.sku || null
                });
            }
        } finally {
            if (searchPage) await searchPage.close().catch(() => {});
            await browser.close();
        }

        const sourceCurrency = items.some(item => item.priceSource === 'saudi-sku-search') ? 'SAR' : inferCurrency(
            cartData.info.normalProducts.find(p => p.salePrice || p.retailPrice)?.salePrice ||
            cartData.info.normalProducts.find(p => p.salePrice || p.retailPrice)?.retailPrice,
            localePrefix
        );

        const result = { items, sourceCurrency };
        sendProgress({ stage: 'done', message: 'Done.', processed: items.length, total: items.length });
        if (isStream) return sendStreamResult(result);
        return res.status(200).json(result);


    } catch (error) {
        console.error("Scraper Error:", error);
        if (isStream) return sendStreamError(500, { error: "Scraping API Error", details: error.message });
        return res.status(500).json({ error: "Scraping API Error", details: error.message });
    }
};
