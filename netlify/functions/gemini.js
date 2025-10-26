import { GoogleGenAI, Type, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateImage = async (payload) => {
    const { promptText } = payload;
    if (!promptText) throw new Error("promptText is required");

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A vibrant, child-friendly illustration for a story about: ${promptText}` }] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes = part.inlineData.data;
            return { imageUrl: `data:image/png;base64,${base64ImageBytes}` };
        }
    }
    throw new Error("Image data not found in response");
};

const getFeedback = async (payload) => {
    const { rootSentence, userSentence } = payload;
    if (!rootSentence || !userSentence) throw new Error("rootSentence and userSentence are required");
    
    const prompt = `You are an AI writing tutor for a 10-year-old. The original sentence was '${rootSentence}'. The student created this new sentence: '${userSentence}'.

    1. Rate the new sentence's quality on a scale of 0.5 to 2.0, where 1.0 is a good but standard improvement. A score of 2.0 should be reserved for exceptionally creative, clear, and well-structured sentences. A score below 1.0 might be for sentences that are overly long, awkward, or grammatically incorrect. This score will be used as a multiplier.
    2. Provide one short, positive, and encouraging tip (no more than 20 words) for how they could make it even better next time.

    Respond ONLY with a valid JSON object.`;

    const response = await ai.models.generateContent({
        // Fix: Use a more advanced model for better feedback quality.
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    qualityScore: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                },
                required: ['qualityScore', 'feedback']
            }
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    const clampedScore = Math.max(0.5, Math.min(result.qualityScore, 2.0));
    return { qualityScore: clampedScore, feedback: result.feedback };
};

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { task, payload } = JSON.parse(event.body);
        let result;

        switch (task) {
            case 'generateImage':
                result = await generateImage(payload);
                break;
            case 'getSentenceFeedback':
                result = await getFeedback(payload);
                break;
            default:
                throw new Error("Invalid task specified");
        }
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};