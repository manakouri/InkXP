import React, { useState, useCallback } from 'react';
import { GameState, Prompt, ScoringCriterion, ScoreAnalysis } from './types.ts';
import HomeScreen from './components/HomeScreen.tsx';
import PracticeSetupScreen from './components/PracticeSetupScreen.tsx';
import GameScreen from './components/GameScreen.tsx';
import ResultsScreen from './components/ResultsScreen.tsx';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Home);
    const [gamePrompt, setGamePrompt] = useState<Prompt | null>(null);
    const [gameCriteria, setGameCriteria] = useState<ScoringCriterion[]>([]);
    const [gameDuration, setGameDuration] = useState<number>(600); // 10 minutes default
    const [finalText, setFinalText] = useState<string>('');
    const [scoreAnalysis, setScoreAnalysis] = useState<ScoreAnalysis | null>(null);

    const handleStartPractice = useCallback((prompt: Prompt, criteria: ScoringCriterion[], duration: number) => {
        setGamePrompt(prompt);
        setGameCriteria(criteria);
        setGameDuration(duration);
        setGameState(GameState.InGame);
    }, []);

    const handleEndGame = useCallback((text: string, analysis: ScoreAnalysis) => {
        setFinalText(text);
        setScoreAnalysis(analysis);
        setGameState(GameState.Results);
    }, []);

    const handlePlayAgain = useCallback(() => {
        setGamePrompt(null);
        setGameCriteria([]);
        setFinalText('');
        setScoreAnalysis(null);
        setGameState(GameState.PracticeSetup);
    }, []);

    const renderContent = () => {
        switch (gameState) {
            case GameState.Home:
                return <HomeScreen onSelectPractice={() => setGameState(GameState.PracticeSetup)} />;
            case GameState.PracticeSetup:
                return <PracticeSetupScreen onStartGame={handleStartPractice} />;
            case GameState.InGame:
                if (gamePrompt && gameCriteria.length > 0) {
                    return (
                        <GameScreen
                            prompt={gamePrompt}
                            criteria={gameCriteria}
                            duration={gameDuration}
                            onTimeUp={handleEndGame}
                        />
                    );
                }
                // Fallback if state is inconsistent
                return <HomeScreen onSelectPractice={() => setGameState(GameState.PracticeSetup)} />;
            case GameState.Results:
                if (finalText && scoreAnalysis && gamePrompt) {
                     return (
                        <ResultsScreen
                            prompt={gamePrompt}
                            finalText={finalText}
                            analysis={scoreAnalysis}
                            onPlayAgain={handlePlayAgain}
                        />
                    );
                }
                 // Fallback if state is inconsistent
                return <HomeScreen onSelectPractice={() => setGameState(GameState.PracticeSetup)} />;
            default:
                return <HomeScreen onSelectPractice={() => setGameState(GameState.PracticeSetup)} />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 to-emerald-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                     <div className="flex items-center justify-center gap-3">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-sky-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        <h1 className="text-4xl sm:text-5xl font-bold text-sky-700 tracking-tight">
                            InkXP
                        </h1>
                    </div>
                    <p className="text-slate-600 mt-2 text-lg">
                        Level up your writing experience.
                    </p>
                </header>
                <main className="bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
                    {renderContent()}
                </main>
                 <footer className="text-center mt-8 text-sm text-slate-500">
                    <p>A gamified writing experience for young authors.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;