
import React, { useState, useCallback } from 'react';
import { GameState, Prompt, ScoringCriterion, ScoreAnalysis } from './types';
import HomeScreen from './components/HomeScreen';
import PracticeSetupScreen from './components/PracticeSetupScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';

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
                    <h1 className="text-4xl sm:text-5xl font-bold text-sky-700 tracking-tight">
                        🥝 Kiwi Writers' Quest
                    </h1>
                    <p className="text-slate-600 mt-2 text-lg">
                        Unleash your storytelling superpowers!
                    </p>
                </header>
                <main className="bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
                    {renderContent()}
                </main>
                 <footer className="text-center mt-8 text-sm text-slate-500">
                    <p>Built for the New Zealand classroom. Aligned with the 2025 English curriculum.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
