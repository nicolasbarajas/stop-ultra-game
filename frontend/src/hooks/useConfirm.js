import { useState } from 'react';

export const useConfirm = () => {
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => { },
        confirmText: 'Confirmar',
        isDanger: true,
        isAlert: false
    });

    const requestConfirm = (message, onConfirm, options = {}) => {
        setConfirmConfig({
            isOpen: true,
            message,
            onConfirm,
            confirmText: options.confirmText || 'Confirmar',
            isDanger: options.isDanger !== undefined ? options.isDanger : true,
            isAlert: false
        });
    };

    const requestAlert = (message, options = {}) => {
        setConfirmConfig({
            isOpen: true,
            message,
            onConfirm: () => { }, // No-op
            confirmText: "Entendido",
            isDanger: options.isDanger !== undefined ? options.isDanger : false,
            isAlert: true
        });
    };

    const closeConfirm = () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    return { confirmConfig, requestConfirm, requestAlert, closeConfirm };
};
