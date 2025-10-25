
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'medium',
    ...props
}) => {
    const baseStyles = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';

    const variantStyles = {
        primary: 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 disabled:hover:bg-sky-600',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 disabled:hover:bg-slate-200',
    };

    const sizeStyles = {
        small: 'py-1.5 px-3 text-sm',
        medium: 'py-2 px-5 text-base',
        large: 'py-3 px-8 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;