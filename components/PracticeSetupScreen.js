const PracticeSetupScreen = ({ onStartGame }) => {
    const { useState, useCallback, useMemo } = React;

    const [currentPrompt, setCurrentPrompt] = useState(() => NARRATIVE_PROMPTS[Math.floor(Math.random() * NARRATIVE_PROMPTS.length)]);
    const [duration, setDuration] = useState(10); // Default 10 minutes

    const generateNewPrompt = useCallback(() => {
        const newPrompt = NARRATIVE_PROMPTS[Math.floor(Math.random() * NARRATIVE_PROMPTS.length)];
        setCurrentPrompt(newPrompt);
    }, []);

    const selectedCriteria = useMemo(() => {
        // Always include sentence structure and conjunctions
        const generalGoals = ALL_SCORING_CRITERIA.filter(c => c.id === 'sentence' || c.id === 'conjunctions');
        
        // Randomly select 3 main goals
        const mainGoalsPool = ALL_SCORING_CRITERIA.filter(c => c.id !== 'sentence' && c.id !== 'conjunctions');
        const shuffled = [...mainGoalsPool].sort(() => 0.5 - Math.random());
        const selectedMainGoals = shuffled.slice(0, 3);
        
        return [...generalGoals, ...selectedMainGoals];
    }, [currentPrompt]); // Re-select criteria if the prompt changes, for variety

    const handleStart = () => {
        onStartGame(currentPrompt, selectedCriteria, duration * 60);
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Practice Mode: Narrative Writing</h2>
            <p className="text-slate-600 mb-6">Generate a story idea below and choose your writing time.</p>
            
            <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md border border-slate-200 mb-6">
                <p className="text-sm font-semibold text-sky-600 mb-2">{currentPrompt.category}</p>
                <p className="text-lg text-slate-700">{currentPrompt.text}</p>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Button onClick={generateNewPrompt} variant="secondary">
                    Generate New Prompt
                </Button>
            </div>

            <div className="w-full max-w-sm mb-8">
                 <label htmlFor="duration" className="block text-center text-sm font-medium text-slate-700 mb-2">
                    Set Timer (minutes)
                </label>
                <div className="flex items-center justify-center gap-4">
                    <input
                        type="range"
                        id="duration"
                        min="10"
                        max="45"
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                    />
                    <span className="font-bold text-sky-600 text-lg w-12 text-center">{duration}</span>
                </div>
            </div>

            <Button onClick={handleStart} size="large">
                Start Writing!
            </Button>
        </div>
    );
};
