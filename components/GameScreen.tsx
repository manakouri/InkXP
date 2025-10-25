
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'https://aistudiocdn.com/react@^19.2.0';
import { Prompt, ScoringCriterion, ScoreAnalysis } from '../types.ts';
import Timer from './Timer.tsx';
import { analyzeScore } from '../services/scoringService.ts';

interface GameScreenProps {
    prompt: Prompt;
    criteria: ScoringCriterion[];
    duration: number; // in seconds
    onTimeUp: (finalText: string, analysis: ScoreAnalysis) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ prompt, criteria, duration, onTimeUp }) => {
    const [text, setText] = useState('');
    const [scoreAnalysis, setScoreAnalysis] = useState<ScoreAnalysis>(() => analyzeScore('', criteria));
    const [isScoreAnimating, setIsScoreAnimating] = useState(false);
    const hasFired = useRef(false);
    const prevScoreRef = useRef(0);

    const wordCount = useMemo(() => {
        if (!text.trim()) return 0;
        return text.trim().split(/\s+/).length;
    }, [text]);

    // Debounced score analysis
    useEffect(() => {
        const handler = setTimeout(() => {
            const analysis = analyzeScore(text, criteria);
            setScoreAnalysis(analysis);

            // Trigger animation if score increases
            if (analysis.totalScore > prevScoreRef.current) {
                setIsScoreAnimating(true);
                setTimeout(() => setIsScoreAnimating(false), 300); // Animation duration
            }
            prevScoreRef.current = analysis.totalScore;

        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [text, criteria]);

    // Use refs to pass latest values to the stable onTimeUp callback
    const textRef = useRef(text);
    textRef.current = text;
    const criteriaRef = useRef(criteria);
    criteriaRef.current = criteria;
    const onTimeUpRef = useRef(onTimeUp);
    onTimeUpRef.current = onTimeUp;

    const handleTimeUp = useCallback(() => {
        if (!hasFired.current) {
            hasFired.current = true;
            const currentText = textRef.current;
            const currentCriteria = criteriaRef.current;
            const finalAnalysis = analyzeScore(currentText, currentCriteria);
            onTimeUpRef.current(currentText, finalAnalysis);
        }
    }, []); // Empty dependency array makes this function stable for the Timer component

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 mb-4">
                    <p className="text-sm font-semibold text-sky-600 mb-2">{prompt.category}</p>
                    <p className="text-lg text-slate-700">{prompt.text}</p>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full min-h-[400px] p-4 border border-slate-300 rounded-lg shadow-inner focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-200"
                    placeholder="Start writing your story here..."
                    aria-label="Story writing area"
                />
            </div>
            <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                    <div className="bg-sky-600 text-white p-4 rounded-lg shadow-lg text-center">
                        <p className="text-lg font-semibold">Time Remaining</p>
                        <Timer initialSeconds={duration} onTimeUp={handleTimeUp} />
                    </div>
                    
                    <div className="bg-emerald-600 text-white p-4 rounded-lg shadow-lg text-center">
                        <p className="text-lg font-semibold">Your Score</p>
                        <p className={`text-5xl font-bold tracking-tighter transition-transform duration-300 ease-out ${isScoreAnimating ? 'scale-125' : 'scale-100'}`}>
                            {scoreAnalysis.totalScore.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-violet-600 text-white p-4 rounded-lg shadow-lg text-center">
                        <p className="text-lg font-semibold">Word Count</p>
                        <p className="text-5xl font-bold tracking-tighter">
                            {wordCount}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Scoring Goals</h3>
                        <ul className="space-y-1">
                            {criteria.map((criterion) => {
                                const item = scoreAnalysis.breakdown.find(b => b.id === criterion.id) || { count: 0 };
                                const hasAchieved = item.count > 0;
                                return (
                                    <li
                                        key={criterion.id}
                                        className={`p-2 rounded-md transition-all duration-300 flex justify-between items-center ${hasAchieved ? 'bg-emerald-50' : 'bg-transparent'}`}
                                        aria-live="polite"
                                    >
                                        <span className="text-sm text-slate-600 pr-2">
                                            <span className={`font-bold ${hasAchieved ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                +{criterion.points.toLocaleString()} pts:
                                            </span> {criterion.description}
                                        </span>
                                        <span
                                            className={`font-bold text-xs px-2 py-0.5 rounded-full transition-all duration-300 flex-shrink-0 ${hasAchieved ? 'bg-emerald-200 text-emerald-800 scale-110' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {item.count}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameScreen;