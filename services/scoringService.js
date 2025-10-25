const countWords = (text, words) => {
    const lowerText = text.toLowerCase();
    let count = 0;
    for (const word of words) {
        // Use a regex to match whole words only
        const regex = new RegExp(`\\b${word.toLowerCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
        const matches = lowerText.match(regex);
        if (matches) {
            count += matches.length;
        }
    }
    return count;
};

const ALL_SCORING_CRITERIA = [
    {
        id: 'dialogue',
        name: 'Dialogue',
        description: 'Using speech with correct punctuation',
        points: 1000,
        check: (text) => (text.match(/"[^"]*"/g) || []).length,
    },
    {
        id: 'adjectives',
        name: 'Adjectives',
        description: `Using varied adjectives`,
        points: 500,
        check: (text) => countWords(text, ADJECTIVES),
    },
    {
        id: 'sensory',
        name: 'Sensory Detail',
        description: 'Using sensory details (sight, sound, smell, touch, taste)',
        points: 1000,
        check: (text) => countWords(text, ALL_SENSORY_WORDS),
    },
    {
        id: 'sentence',
        name: 'Sentence Structure',
        description: 'Correctly punctuated sentence (. ! ?)',
        points: 50,
        check: (text) => {
             // Split by sentence-ending punctuation and filter out empty strings.
            const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
            // Check if each sentence starts with a capital letter.
            return sentences.filter(s => s.trim().match(/^[A-Z]/)).length;
        },
    },
    {
        id: 'conjunctions',
        name: 'Complex Sentences',
        description: 'Using conjunctions to create compound/complex sentences',
        points: 50,
        check: (text) => countWords(text, CONJUNCTIONS),
    },
     {
        id: 'simile',
        name: 'Similes',
        description: 'Using similes (comparing with "like" or "as")',
        points: 100,
        check: (text) => (text.match(/\b\w+\s+(like|as)\s+\w+\b/gi) || []).length,
    },
    {
        id: 'transitional',
        name: 'Transitional Words',
        description: 'Using transitional words or phrases',
        points: 100,
        check: (text) => countWords(text, TRANSITIONAL_WORDS),
    }
];

const analyzeScore = (text, criteria) => {
    let totalScore = 0;
    const breakdown = criteria.map(criterion => {
        const count = criterion.check(text);
        const score = count * criterion.points;
        totalScore += score;
        return { id: criterion.id, name: criterion.name, count, score };
    });

    if (breakdown.length === 0) {
        return { totalScore: 0, breakdown: [], highestScoring: { name: 'N/A', score: 0}, lowestScoring: { name: 'N/A', score: 0}};
    }

    const sortedByScore = [...breakdown].sort((a, b) => b.score - a.score);

    const highestScoring = { name: sortedByScore[0].name, score: sortedByScore[0].score };
    const lowestScoring = { name: sortedByScore[sortedByScore.length - 1].name, score: sortedByScore[sortedByScore.length - 1].score };

    return { totalScore, breakdown, highestScoring, lowestScoring };
};