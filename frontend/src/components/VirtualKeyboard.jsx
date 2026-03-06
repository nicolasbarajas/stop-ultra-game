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

            <div className="flex h-12 bg-black/40 border-b border-gray-700 relative z-20 overflow-hidden mx-2">

                {/* Botón de Borrar - Cuadrado perfecto a la izquierda */}
                <button
                    onClick={handleClick(onDeleteAll)}
                    onTouchStart={handleTouch(onDeleteAll)}
                    title="Borrar toda la palabra"
                    className="w-12 h-12 flex-shrink-0 bg-red-600/80 active:bg-red-700 active:scale-95 text-white flex items-center justify-center touch-manipulation shadow-lg shadow-red-900/20 transition-all"
                >
                    <span className="text-xl">🗑️</span>
                </button>

                {/* Display del Input - Ocupa el 100% del espacio restante */}
                <div className="flex-1 h-full flex items-center justify-center px-4 overflow-hidden relative">
                    <div
                        className="w-full text-center whitespace-nowrap overflow-x-auto hide-scrollbar"
                        style={{
                            fontSize: `${Math.min(1.5, 20 / Math.max(13, currentText.length))}rem`,
                            transition: 'font-size 0.2s ease-in-out'
                        }}
                    >
                        <span className="font-bold tracking-widest text-white">
                            {currentText.split('').map((char, index) => (
                                <span key={index} className={char === ' ' ? 'text-gray-500 mx-[0.2em]' : ''}>
                                    {char === ' ' ? '␣' : char}
                                </span>
                            ))}
                        </span>
                    </div>
                </div>

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
                                    ? 'flex-[1.5] bg-red-600/80 text-white active:bg-red-700 border border-red-500/30 my-2 ml-2 mr-0'
                                    : 'flex-1 max-w-[10%] bg-slate-700 text-white active:bg-slate-500 mt-2'
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
