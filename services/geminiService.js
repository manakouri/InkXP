const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateFeedback = async (
    text,
    analysis
) => {
    if (!text.trim()) {
        return "It looks like you didn't get a chance to write anything. No worries! Give it another go and see what amazing story you can create.";
    }

    const breakdownText = analysis.breakdown.map(item => `- ${item.name}: You scored ${item.score} points from ${item.count} use(s).`).join('\n');

    const prompt = `
        You are an experienced, friendly, and encouraging primary school teacher specializing in literacy.
        A student has just finished a creative writing practice game. Your task is to provide clear, constructive, and positive feedback on their writing.

        Here is the student's story:
        ---
        ${text}
        ---

        Here is their score analysis:
        - Total Score: ${analysis.totalScore}
        - Score Breakdown:
        ${breakdownText}
        - They scored the MOST points for: ${analysis.highestScoring.name}.
        - They scored the LEAST points for: ${analysis.lowestScoring.name}.

        Please provide feedback in a single block of text, using simple paragraph breaks (\n\n). Address the student directly. Your feedback should:
        1.  Start with a positive and encouraging opening.
        2.  Specifically praise what they did well, referencing their highest-scoring area (${analysis.highestScoring.name}). Give a brief example from their text if possible.
        3.  Gently suggest an area for improvement, referencing their lowest-scoring area (${analysis.lowestScoring.name}). Provide a clear, actionable tip on how they could incorporate this into their writing next time. For example, if they need more transitional words, suggest examples like 'Suddenly' or 'A moment later'.
        4.  End with a positive and motivating closing statement.
        5.  Keep the tone light, fun, and appropriate for a 9-11 year old. Do not be overly critical.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API error:", error);
        throw new Error("Failed to generate feedback from AI.");
    }
};