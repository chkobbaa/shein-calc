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

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: [
                ...formattedImages,
                prompt
            ],
            config: {
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
            }
        });

        const items = JSON.parse(response.text);

        return res.status(200).json({ items });

    } catch (error) {
        console.error("AI Extraction Error:", error);
        return res.status(500).json({ error: "AI Processing Error", details: error.message });
    }
};
