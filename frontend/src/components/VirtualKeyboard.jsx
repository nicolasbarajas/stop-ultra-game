import React, { useCallback, useRef } from 'react';

const VirtualKeyboard = ({ onKeyPress, onSend, onDeleteAll, onBackspace, currentText, disabled }) => {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    // Ref to track last touch time to ignore potential ghost clicks
    const lastTouchTime = useRef(0);
    const DEBOUNCE_MS = 350; // Increased to 350ms to strictly catch ghost clicks (usually ~300ms)

    const handleTouch = useCallback((action) => (e) => {
        if (disabled) return;

        // We handle the action here, and mark the time
        lastTouchTime.current = Date.now();

        // Standard prevention
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        action();
    }, [disabled]);

    const handleClick = useCallback((action) => (e) => {
        if (disabled) return;

        const now = Date.now();
        // GHOST CLICK CHECK: If a touch happened recently (< 500ms), this click is likely a ghost
        // or a double-fire from the browser emulating mouse events. IGNORE IT.
        if (now - lastTouchTime.current < 500) {
            console.log("Ghost click prevented");
            return;
        }

        action();
    }, [disabled]);


    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t-2 border-gray-700 flex flex-col z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] select-none pb-2">

            {/* Row 1: Delete Actions (50% each) */}
            <div className="flex w-full h-12 border-b border-gray-700">
                <button
                    onClick={handleClick(onDeleteAll)}
                    onTouchStart={handleTouch(onDeleteAll)}
                    className="flex-1 bg-red-900/40 text-red-200 font-bold text-lg flex items-center justify-center active:bg-red-800 touch-manipulation border-r border-gray-700"
                >
                    🗑️
                </button>
                <button
                    onClick={handleClick(onBackspace)}
                    onTouchStart={handleTouch(onBackspace)}
                    className="flex-1 bg-slate-800 text-white font-bold text-lg flex items-center justify-center active:bg-slate-700 touch-manipulation"
                >
                    ⌫
                </button>
            </div>

            {/* Row 2: Input Display (Full Width) */}
            <div className="w-full h-14 bg-black/40 flex items-center justify-center border-b border-gray-700 relative overflow-hidden">
                <span className="text-xl font-bold tracking-widest text-white uppercase truncate px-4">
                    {currentText}
                </span>
                <span className="w-1 h-8 bg-purple-500 animate-pulse absolute right-4"></span>
            </div>


            {/* Keys */}
            <div className="flex flex-col p-2 gap-1 mt-1">
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex flex-1 gap-1 justify-center">
                        {row.map((key) => (
                            <button
                                key={key}
                                onClick={handleClick(() => onKeyPress(key))}
                                touch-action="none"
                                onTouchStart={handleTouch(() => onKeyPress(key))}
                                className="flex-1 max-w-[10%] h-12 rounded bg-slate-700 text-white font-bold text-xl active:bg-slate-500 shadow-sm transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                ))}

                {/* Action Row: Space & Send (Equal Width) */}
                <div className="flex gap-2 justify-center mt-1">
                    <button
                        onClick={handleClick(() => onKeyPress(' '))}
                        onTouchStart={handleTouch(() => onKeyPress(' '))}
                        className="flex-1 h-12 rounded bg-slate-700 text-white font-bold text-lg active:bg-slate-600 shadow-sm flex items-center justify-center touch-manipulation"
                    >
                        Espacio
                    </button>
                    <button
                        onClick={handleClick(() => onSend())}
                        onTouchStart={handleTouch(() => onSend())}
                        className="flex-1 h-12 rounded bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-xl active:scale-[0.98] shadow-lg flex items-center justify-center touch-manipulation"
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VirtualKeyboard;
