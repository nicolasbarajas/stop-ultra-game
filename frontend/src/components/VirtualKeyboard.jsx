import React, { useCallback, useRef } from 'react';

const VirtualKeyboard = ({ onKeyPress, onSend, onDeleteAll, onBackspace, currentText, disabled }) => {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
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
        <div className="w-full bg-gray-900 border-t border-gray-800 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)] select-none pb-safe -mt-4 relative z-50 overscroll-none touch-none">

            {/* Row 1: Delete All (Full Width) */}
            <div className="flex w-full h-14 relative z-20 mb-3 pl-3 pr-3 pt-3">
                <button
                    onClick={handleClick(onDeleteAll)}
                    onTouchStart={handleTouch(onDeleteAll)}
                    className="w-full h-full bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-sm tracking-wide flex items-center justify-center touch-manipulation rounded-2xl shadow-lg shadow-red-900/20 transition-all"
                >
                    Borrar toda la palabra 🗑️
                </button>
            </div>

            {/* Row 2: Input Display (Full Width) */}
            <div className="w-full h-14 bg-black/40 flex items-center justify-center border-b border-gray-700 relative overflow-hidden px-4">
                <span className="text-xl font-bold tracking-widest text-white uppercase truncate">
                    {currentText.split('').map((char, index) => (
                        <span key={index} className={char === ' ' ? 'text-gray-500 mx-0.5' : ''}>
                            {char === ' ' ? '␣' : char}
                        </span>
                    ))}
                </span>
            </div>


            {/* Keys */}
            <div className="flex flex-col p-1 gap-1 mt-1">
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex flex-1 gap-1 justify-center">
                        {row.map((key) => (
                            <button
                                key={key}
                                onClick={handleClick(() => key === '⌫' ? onBackspace() : onKeyPress(key))}
                                touch-action="none"
                                onTouchStart={handleTouch(() => key === '⌫' ? onBackspace() : onKeyPress(key))}
                                className={`h-12 rounded font-bold text-xl shadow-sm transition-colors flex items-center justify-center active:scale-95 touch-manipulation ${key === '⌫'
                                    ? 'flex-[1.5] bg-red-600/80 text-white active:bg-red-700 border border-red-500/30'
                                    : 'flex-1 max-w-[10%] bg-slate-700 text-white active:bg-slate-500'
                                    }`}
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
