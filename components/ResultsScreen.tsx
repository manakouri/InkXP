
import React, { useState, useEffect } from 'react';
import { Prompt, ScoreAnalysis } from '../types.js';
import { generateFeedback } from '../services/geminiService.js';
import Button from './Button.js';
import LoadingSpinner from './LoadingSpinner.js';

interface ResultsScreenProps {
    prompt: Prompt;
    finalText: string;
    analysis: ScoreAnalysis;
    onPlayAgain: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ prompt, finalText, analysis, onPlayAgain }) => {
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getFeedback = async () => {
            setIsLoading(true);
            try {
                const generatedFeedback = await generateFeedback(finalText, analysis);
                setFeedback(generatedFeedback);
            } catch (error) {
                console.error("Error generating feedback:", error);
                setFeedback("I had a little trouble generating feedback this time. Great effort on your writing, though! Please try again.");
            }
            setIsLoading(false);
        };

        getFeedback();
    }, [finalText, analysis]);

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bold text-emerald-600 mb-2">Time's Up!</h2>
            <p className="text-slate-600 mb-6">Fantastic effort! Here's your final score and feedback.</p>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">Your Story</h3>
                    <p className="text-sm font-semibold text-sky-600 mb-2">{prompt.text}</p>
                    <div className="prose max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-md">
                        {finalText || "You didn't write anything this time. Try again!"}
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 text-center">
                        <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider">Total Score</h3>
                        <p className="text-6xl font-bold text-sky-600 my-2">{analysis.totalScore}</p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">Teacher Feedback</h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-24">
                                <LoadingSpinner />
                                <span className="ml-4 text-slate-500">Thinking...</span>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: feedback.replace(/\n/g, '<br />') }}></div>
                        )}
                    </div>
                </div>
            </div>
             <Button onClick={onPlayAgain} size="large" className="mt-8">
                Play Again
            </Button>
        </div>
    );
};

export default ResultsScreen;