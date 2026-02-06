import React from 'react';

const HelpModal = ({ onClose }) => {
    return (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border-2 border-purple-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    ¿Cómo jugar?
                </h2>

                <div className="space-y-6 text-white/90">
                    {/* Step 1 */}
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold shrink-0">1</div>
                        <div>
                            <h4 className="font-bold text-purple-300">Modo Presencial</h4>
                            <p className="text-sm text-gray-400">Diseñado para jugar en grupo. Cada uno usa su celular, pero la diversión está en el debate.</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold shrink-0">2</div>
                        <div>
                            <h4 className="font-bold text-pink-300">Gira y Responde</h4>
                            <p className="text-sm text-gray-400">Un moderador gira la ruleta. Todos deben escribir algo de la <strong>Categoría</strong> que empiece con la <strong>Letra</strong> indicada.</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold shrink-0">3</div>
                        <div>
                            <h4 className="font-bold text-blue-300">Debate Final</h4>
                            <p className="text-sm text-gray-400">¿Es válida la respuesta? ¡Ustedes deciden! El moderador confirma al ganador basado en el consenso del grupo.</p>
                        </div>
                    </div>

                </div>

                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                    >
                        ¡Entendido!
                    </button>
                </div>

            </div>
        </div>
    );
};

export default HelpModal;
