
import React from 'react';
import Button from './Button';

interface HomeScreenProps {
    onSelectPractice: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectPractice }) => {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome, Young Writer!</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                Choose a mode to begin your writing adventure. Sharpen your skills, join a friend's game, or create a challenge for your class!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <ModeCard
                    title="Create a Game"
                    description="Be the game master! Choose prompts, set timers, and challenge your friends."
                    icon=" M12 4.5v15m7.5-7.5h-15"
                    onClick={() => alert("Create a Game mode is coming soon!")}
                    disabled={true}
                />
                <ModeCard
                    title="Join a Game"
                    description="Got a game code? Enter it here to join a writing quest with your classmates."
                    icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    onClick={() => alert("Join a Game mode is coming soon!")}
                    disabled={true}
                />
                <ModeCard
                    title="Practice Mode"
                    description="Fly solo! Get a random prompt and practice your writing skills at your own pace."
                    icon="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    onClick={onSelectPractice}
                    disabled={false}
                />
            </div>
        </div>
    );
};

interface ModeCardProps {
    title: string;
    description: string;
    icon: string;
    onClick: () => void;
    disabled: boolean;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, icon, onClick, disabled }) => (
    <div className={`p-6 rounded-xl shadow-md flex flex-col items-center text-center transition-all duration-300 ${disabled ? 'bg-slate-200 text-slate-500' : 'bg-white hover:shadow-xl hover:-translate-y-1'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${disabled ? 'bg-slate-300' : 'bg-sky-100 text-sky-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm mb-4 flex-grow">{description}</p>
        <Button onClick={onClick} disabled={disabled} className="mt-auto">
            {disabled ? 'Coming Soon' : 'Let\'s Go!'}
        </Button>
    </div>
);

export default HomeScreen;
