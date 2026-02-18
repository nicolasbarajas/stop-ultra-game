import React from 'react';

const PreviousAnswersModal = ({ isOpen, onClose, history, currentCategory }) => {
    if (!isOpen) return null;

    // Filter history for current category
    const categoryHistory = history.filter(item => item.category === currentCategory);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">
                        Respuestas Previas
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-4 text-sm text-gray-400">
                        Categoría: <span className="text-yellow-400 font-bold">{currentCategory}</span>
                    </div>

                    {categoryHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">
                            No hay respuestas ganadoras<br />previas en esta categoría.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {categoryHistory.map((entry, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                            {entry.winner}
                                        </span>
                                        <span className="text-white font-bold text-lg">
                                            {entry.word}
                                        </span>
                                    </div>
                                    <div className="text-xs text-green-500/50 font-mono">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreviousAnswersModal;
