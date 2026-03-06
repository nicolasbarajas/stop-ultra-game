import React, { useEffect, useState } from 'react';

const ToastNotification = ({ message, isVisible }) => {
    const [render, setRender] = useState(isVisible);

    useEffect(() => {
        if (isVisible) setRender(true);
    }, [isVisible]);

    useEffect(() => {
        let unmountTimer;

        if (!isVisible && render) {
            // Wait for fade-out animation to finish before unmounting (e.g., 300ms)
            unmountTimer = setTimeout(() => {
                setRender(false);
            }, 300);
        }

        return () => {
            clearTimeout(unmountTimer);
        };
    }, [isVisible, render]);

    if (!render) return null;

    return (
        <div className="fixed top-4 left-0 w-full flex justify-center z-[200] pointer-events-none px-4">
            <div
                className={`w-max max-w-[90vw] px-6 py-3.5 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.2)] rounded-full flex items-center justify-center gap-3.5 pointer-events-auto transition-all duration-400 ease-out transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-90'
                    }`}
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white drop-shadow-sm">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="text-slate-100 font-sans font-medium text-[15px] tracking-wide text-center leading-tight">
                    {message}
                </span>
            </div>
        </div>
    );
};

export default ToastNotification;
