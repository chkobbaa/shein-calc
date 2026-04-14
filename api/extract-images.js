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

        // The exact extraction guide is referenced here within the prompt:
        const prompt = `
Extract product information from the provided shein cart screenshots.

Rule 1. look for orange text with a decimal number, this is the discounted price.
Rule 2. if no orange text is found, look for strike through text with a decimal number, this is the original price.
Rule 3. if both are found, return the discounted price in \`salePrice\` property, and the original price in \`origPrice\` property.
Rule 4. if only one is found, return that price in both properties.
Rule 5. if neither is found, return 0.
Rule 6. Calculate the discount percentage as ((origPrice - salePrice) / origPrice) * 100 rounded to next integer, or 0 if no discount.

For each item identified in the screenshots, return the required data format exactly.
IMPORTANT: The screenshots might overlap! If you see the exact same item at the bottom of screenshot 1 and the top of screenshot 2, DO NOT count it twice. Only return unique items.
Use a placeholder string "placeholder" for the \`image\` property.
Use "#" for the \`link\` property.
Make up a short descriptive name for each product in the \`name\` property (e.g. "Robe imprimée", "Collier strass").
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
                        link: { type: "STRING" }
                    },
                    required: ["name", "origPrice", "salePrice", "discount", "image", "link"]
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
                
                uniqueItems.push(item);
            }
        }

        return res.status(200).json({ items: uniqueItems });

    } catch (error) {
        console.error("AI Extraction Error:", error);
        return res.status(500).json({ error: "AI Processing Error", details: error.message });
    }
};
