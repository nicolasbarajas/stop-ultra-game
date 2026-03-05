import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ isOpen, onClose, onConfirm, message, cancelText = "Cancelar", confirmText = "Confirmar", isDanger = true }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-6"
                    >
                        <div className="text-center">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirmación</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors shadow-lg ${isDanger
                                        ? 'bg-red-500/80 hover:bg-red-500 shadow-red-500/20'
                                        : 'bg-indigo-500/80 hover:bg-indigo-500 shadow-indigo-500/20'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
