const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Configure the SDK using standard process.env.GEMINI_API_KEY
// Fallback logic if the SDK is initialized inside the request:
let ai;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY non configurée sur le serveur.' });
        }
        if (!ai) {
            ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }

        const { images } = req.body; // Expecting an array of base64 strings

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'No images provided.' });
        }

        const formattedImages = images.map(imgBase64 => {
            // Strip data:image/png;base64, prefix if present
            const stripped = imgBase64.replace(/^data:image\/[a-z]+;base64,/, "");
            return {
                inlineData: {
                    data: stripped,
                    mimeType: "image/jpeg" // GenAI infers the format, but assuming jpeg or png is fine
                }
            };
        });

        // Highly detailed, structural instructions to ensure accurate price extraction
        const prompt = `
Extract product information from the provided Shein cart screenshots.

To perfectly extract the item prices, follow this logical step-by-step reasoning for EVERY item you find:
1. Locate the price blocks next to the item thumbnail. They will usually contain the currency "SAR".
2. You will either find ONE price or TWO prices associated with an item.
3. IF TWO PRICES ARE FOUND: 
   - Compare the two decimal numbers.
   - The HIGHER number is the original retail price. It usually has a strikethrough overlay (crossed out). Extract this into the \`origPrice\` property.
   - The LOWER number is the current discounted price the user is paying. It is often bolded, highlighted in red/orange, or displayed prominently next to the strikethrough price. Extract this into the \`salePrice\` property.
4. IF ONLY ONE PRICE IS FOUND:
   - This means the item is not on sale. Extract this single number into BOTH the \`origPrice\` and \`salePrice\` properties.
5. IF NO PRICE CAN BE FOUND:
   - Return 0 for both properties.
6. Calculate the discount percentage: If origPrice > salePrice, calculate ((origPrice - salePrice) / origPrice) * 100 rounded to the nearest whole integer. Otherwise, return 0.

For each item identified in the screenshots, return the required JSON data format exactly.
IMPORTANT: The screenshots might overlap! If you see the exact same item at the bottom of screenshot #1 and the top of screenshot #2, DO NOT count it twice. Only return unique items.

CRITICAL - DO NOT SPLIT PRODUCTS:
- A single product is visually represented by ONE thumbnail image.
- Do NOT split the text corresponding to a single thumbnail into multiple products.
- Sometimes titles wrap to new lines or have variants (like "Black >" or "usa variant"). Combine ALL of this text into the single "name" property for that product. Never treat "Black >" or a disconnected variant name as its own product item. ONE thumbnail = EXACTLY ONE product array item.

Use the literal string "placeholder" for the "image" property.
Use "#" for the "link" property.
Make up a short descriptive name for each product in the "name" property (e.g. "Robe imprimée", "Pink Tote Bag").
Set "imageIndex" to an integer starting from 1 identifying which screenshot contains the item (e.g., 1 for the first image, 2 for the second).
`;

        const generateWithFallback = async (contents, config) => {
            const models = [
                "gemini-3.1-flash-lite-preview",
                "gemini-2.5-flash",
                "gemini-2.5-flash-lite"
            ];

            let lastError;
            for (const model of models) {
                try {
                    console.log(`Attempting AI extraction with model: ${model}`);
                    const response = await ai.models.generateContent({
                        model,
                        contents,
                        config
                    });
                    return response;
                } catch (error) {
                    console.error(`AI model ${model} failed:`, error.message);
                    lastError = error;
                }
            }
            throw lastError;
        };

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING" },
                        origPrice: { type: "NUMBER" },
                        salePrice: { type: "NUMBER" },
                        discount: { type: "INTEGER" },
                        image: { type: "STRING" },
                        link: { type: "STRING" },
                        imageIndex: { type: "INTEGER" }
                    },
                    required: ["name", "origPrice", "salePrice", "discount", "image", "link", "imageIndex"]
                }
            }
        };

        const response = await generateWithFallback(
            [...formattedImages, prompt],
            config
        );

        let items = JSON.parse(response.text);

        // Strict deduplication to prevent AI hallucinations where it counts an item twice
        const uniqueItems = [];
        const seen = new Set();

        for (const item of items) {
            if (!item || typeof item !== 'object') continue;

            const nameSpace = (item.name || "Unknown Item").toString().toLowerCase().trim();
            const origPrice = item.origPrice || 0;
            const salePrice = item.salePrice || 0;

            // Ignore hallucinated fragments with no price
            if (origPrice === 0 && salePrice === 0) continue;

            // Creating a unique key based on name and both prices
            const key = `${nameSpace}_${origPrice}_${salePrice}`;
            if (!seen.has(key)) {
                seen.add(key);
                // Ensure required fields exist
                item.name = item.name || "Unknown Item";
                item.origPrice = origPrice;
                item.salePrice = salePrice;
                item.discount = item.discount || 0;
                item.link = item.link || "#";
                item.image = item.image || "placeholder";
                item.imageIndex = item.imageIndex || 1;

                uniqueItems.push(item);
            }
        }

        return res.status(200).json({ items: uniqueItems });

    } catch (error) {
        console.error("AI Extraction Error:", error);
        return res.status(500).json({ error: "AI Processing Error", details: error.message });
    }
};
