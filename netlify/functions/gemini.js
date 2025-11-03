const { GoogleGenAI, Type } = require("@google/genai");
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This will use the service account credentials from the environment variables in Netlify
try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
} catch (e) {
  console.error('Firebase admin initialization error', e);
}
const db = admin.firestore();


if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getFeedback = async (payload) => {
    const { rootSentence, userSentence } = payload;
    if (!rootSentence || !userSentence) throw new Error("rootSentence and userSentence are required");
    
    const prompt = `You are an AI writing tutor for a 10-year-old. The original simple sentence was '${rootSentence}'. The student has rewritten it as: '${userSentence}'.

Your task is to provide a quality score and feedback.

1.  **Meaning Check:** First, evaluate if the student's new sentence ('${userSentence}') preserves the core meaning of the original ('${rootSentence}'). The student is allowed to change the main noun and verb to more powerful synonyms (e.g., 'The cat sat' could become 'The leopard lounged'). If the meaning is completely unrelated (e.g., 'The cat sat' becomes 'The spaceship flew'), assign a score of 0.5 and provide feedback explaining that the sentence has strayed too far from the original idea. If the core meaning is preserved, then proceed with the scoring and feedback as described below.

2.  **Scoring (qualityScore):** Provide a score between 0.5 and 2.0. This score will be used as a multiplier. Base the score on the following criteria combined:
    *   **Creativity & Interest:** Is the new sentence significantly more engaging and interesting than the original?
    *   **Adjectives & Sensory Details:** Does it use descriptive words effectively to paint a picture?
    *   **Language Features:** Does it include features like similes, alliteration, or varied sentence structure?
    *   **Punctuation & Grammar:** Is the sentence grammatically correct with proper punctuation?

3.  **Feedback (feedback):** Provide one short, positive, and encouraging tip (no more than 20 words) that is specific to their sentence on how they could make it even better next time.

Respond ONLY with a valid JSON object.`;

    const response = await ai.models.generateContent({
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

const updateLeaderboardTask = async (payload) => {
    const { score, initials } = payload;
    if (!score || !initials) throw new Error("Score and initials are required.");

    const leaderboardRef = db.collection('leaderboard').doc('sentenceLab');

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(leaderboardRef);

        const newEntry = {
            score: Number(score),
            initials: initials,
            createdAt: admin.firestore.Timestamp.now() // Use Timestamp.now() instead of FieldValue.serverTimestamp()
        };

        if (!doc.exists) {
            transaction.set(leaderboardRef, { scores: [newEntry] });
            return;
        }

        const data = doc.data();
        const existingScores = data.scores || [];

        // Self-healing filter
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