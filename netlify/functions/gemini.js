const { GoogleGenAI, Type } = require("@google/genai");
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  if (admin.apps.length === 0) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  console.error('Firebase admin initialization error. Make sure FIREBASE_SERVICE_ACCOUNT_JSON is set correctly in Netlify.', e);
}
const db = admin.firestore();


if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getFeedback = async (payload) => {
    const { rootSentence, userSentence } = payload;
    if (!rootSentence || !userSentence) throw new Error("rootSentence and userSentence are required");
    
    const prompt = `You are an expert AI writing teacher evaluating a sentence written by a 10-year-old student.
The student was given a simple "root" sentence: '${rootSentence}'.
They have rewritten it as: '${userSentence}'.

Your task is to analyze the student's sentence based on four criteria and provide a score from 0.0 to 1.0 for each. You must also provide a short, encouraging feedback message.

Analyze the following criteria:
1.  **coherenceScore**: How well does the student's sentence retain the core meaning of the root sentence? Does it make grammatical sense? If it's gibberish or completely off-topic (e.g., from '${rootSentence}' to 'I like pizza'), this score should be very low (e.g., 0.1). If it's a perfect, relevant upgrade, it should be 1.0.
2.  **vividnessScore**: How well does the sentence use strong verbs, precise nouns, and evocative adjectives/adverbs to create a clear picture? A score of 0.0 means no improvement. A score of 1.0 means it is extremely descriptive and vivid.
3.  **figurativeLanguageScore**: Does the sentence use figurative language like similes, metaphors, or personification? A score of 0.0 means no figurative language. A score of 1.0 indicates a well-used and creative instance of figurative language.
4.  **complexityScore**: How much has the student improved the grammatical structure? Look for things like subordinate clauses, prepositional phrases, or varied sentence openers. A score of 0.0 means the structure is identical to the root. A score of 1.0 means it is a well-formed, complex sentence.

Finally, provide **feedback**: A single, short (max 20 words) sentence of positive and encouraging feedback with a specific tip for next time.

Respond ONLY with a valid JSON object in the specified format. Do not add any explanation or introductory text.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    coherenceScore: { type: Type.NUMBER },
                    vividnessScore: { type: Type.NUMBER },
                    figurativeLanguageScore: { type: Type.NUMBER },
                    complexityScore: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                },
                required: ['coherenceScore', 'vividnessScore', 'figurativeLanguageScore', 'complexityScore', 'feedback']
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

const updateLeaderboardTask = async (payload) => {
    const { score, initials } = payload;
    if (!score || !initials) throw new Error("Score and initials are required.");

    const leaderboardRef = db.collection('leaderboard').doc('sentenceLab');

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(leaderboardRef);

        const newEntry = {
            score: Number(score),
            initials: initials,
            createdAt: admin.firestore.Timestamp.now()
        };

        if (!doc.exists) {
            transaction.set(leaderboardRef, { scores: [newEntry] });
            return;
        }

        const data = doc.data();
        const existingScores = data.scores || [];

        // Self-healing filter to remove malformed entries
        const cleanScores = existingScores.filter(entry => 
            entry && typeof entry === 'object' && typeof entry.score === 'number' && !isNaN(entry.score)
        );

        cleanScores.push(newEntry);
        cleanScores.sort((a, b) => b.score - a.score);
        const topScores = cleanScores.slice(0, 10);

        transaction.update(leaderboardRef, { scores: topScores });
    });

    return { success: true, message: "Leaderboard updated successfully." };
};


exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { task, payload } = JSON.parse(event.body);
        let result;

        switch (task) {
            case 'getSentenceFeedback':
                result = await getFeedback(payload);
                break;
            case 'updateLeaderboard':
                result = await updateLeaderboardTask(payload);
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