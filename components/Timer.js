const Timer = ({ initialSeconds, onTimeUp }) => {
    const { useState, useEffect } = React;
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) {
            onTimeUp();
            return;
        }

        const intervalId = setInterval(() => {
            setSeconds(prevSeconds => prevSeconds - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [seconds, onTimeUp]);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        <div className="text-5xl font-bold tracking-tighter">
            <span>{minutes.toString().padStart(2, '0')}</span>
            <span className="animate-pulse">:</span>
            <span>{remainingSeconds.toString().padStart(2, '0')}</span>
        </div>
    );
};
