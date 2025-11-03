const { GoogleGenAI, Type } = require("@google/genai");
const admin = require('firebase-admin');
const crypto = require('crypto');

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

const checkSimilarity = async (payload) => {
    const { newSentence, previousSentences } = payload;
    if (!newSentence || !previousSentences || previousSentences.length === 0) {
        return { is_similar: false };
    }

    const prompt = `You are an AI judge for a creative writing game. A player has submitted a new sentence. Compare it to their list of previous high-scoring sentences.

Your task is to determine if the new sentence is just a minor tweak or a semantically identical rephrasing of any of the previous sentences. A minor tweak would be changing one or two words (e.g., 'huge' to 'big'), adding a comma, or slightly reordering the words without changing the core idea.

New Sentence: "${newSentence}"

Previous Sentences:
${previousSentences.map(s => `- "${s}"`).join('\n')}

Is the new sentence just a minor, uncreative tweak of any of the previous sentences? Respond ONLY with a valid JSON object.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    is_similar: { type: Type.BOOLEAN, description: "True if the new sentence is a minor tweak, false otherwise." },
                    reason: { type: Type.STRING, description: "A brief explanation for your decision." }
                },
                required: ['is_similar', 'reason']
            }
        }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


const updateLeaderboardTask = async (payload) => {
    const { score, initials, userSentence, playerId } = payload;
    if (!score || !initials || !userSentence || !playerId) {
        throw new Error("Score, initials, userSentence, and playerId are required.");
    }
    
    const sentenceHash = crypto.createHash('sha256').update(userSentence.trim().toLowerCase()).digest('hex');
    const leaderboardRef = db.collection('leaderboard').doc('sentenceLab');
    const submissionsRef = db.collection('playerSubmissions');

    // Layer 1: Check for exact duplicate for this player
    const exactQuery = submissionsRef.where('playerId', '==', playerId).where('sentenceHash', '==', sentenceHash);
    const exactSnapshot = await exactQuery.get();
    if (!exactSnapshot.empty) {
        return { success: false, message: "This exact sentence has already been submitted." };
    }

    // Layer 2: Check for semantic similarity
    const previousSubmissionsQuery = submissionsRef.where('playerId', '==', playerId).orderBy('score', 'desc').limit(5);
    const previousSubmissionsSnapshot = await previousSubmissionsQuery.get();
    
    if (!previousSubmissionsSnapshot.empty) {
        const previousSentences = previousSubmissionsSnapshot.docs.map(doc => doc.data().sentenceText);
        const similarityResult = await checkSimilarity({ newSentence: userSentence, previousSentences });
        if (similarityResult.is_similar) {
            return { success: false, message: "This sentence is too similar to one of your previous high scores." };
        }
    }

    // If all checks pass, proceed to update leaderboard and log submission
    await db.runTransaction(async (transaction) => {
        const leaderboardDoc = await transaction.get(leaderboardRef);

        const newEntry = {
            score: Number(score),
            initials: initials,
            createdAt: admin.firestore.Timestamp.now()
        };

        let existingScores = [];
        if (leaderboardDoc.exists) {
            const data = leaderboardDoc.data();
            // Self-healing filter to remove malformed entries
            existingScores = (data.scores || []).filter(entry => 
                entry && typeof entry === 'object' && typeof entry.score === 'number' && !isNaN(entry.score)
            );
        }

        existingScores.push(newEntry);
        existingScores.sort((a, b) => b.score - a.score);
        const topScores = existingScores.slice(0, 10);
        
        if (!leaderboardDoc.exists) {
           transaction.set(leaderboardRef, { scores: topScores });
        } else {
           transaction.update(leaderboardRef, { scores: topScores });
        }
        
        // Add to player submissions log
        const newSubmissionRef = submissionsRef.doc();
        transaction.set(newSubmissionRef, {
            playerId,
            sentenceHash,
            sentenceText: userSentence,
            score: Number(score),
            createdAt: admin.firestore.Timestamp.now()
        });
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
