import React, { useState, useRef } from 'react';
import logoWhatsapp from '../assets/whatsapp.png';
import ToastNotification from './ToastNotification';

const RoomShareHeader = ({ roomId, title, className, iconMargin = 8 }) => {
    const [showToast, setShowToast] = useState(false);
    const toastTimer = useRef(null);

    const handleCopy = (e) => {
        e.preventDefault();
        const text = `${window.location.origin}/room/${roomId}`;

        const triggerToast = () => {
            setShowToast(true);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => {
                setShowToast(false);
            }, 3000);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(triggerToast)
                .catch(err => console.error(err));
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.prepend(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                triggerToast();
            } catch (error) {
                console.error(error);
            } finally {
                textArea.remove();
            }
        }
    };

    const mlClass = iconMargin === 4 ? 'ml-4' : 'ml-8';
    const mrClass = iconMargin === 4 ? 'mr-4' : 'mr-8';

    return (
        <div className={className}>
            {/* Botón de WhatsApp */}
            <a
                className={`absolute left-full top-1/2 -translate-y-1/2 ${mlClass} flex-shrink-0 hover:opacity-80 transition-opacity`}
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    const shareUrl = `${window.location.origin}/room/${roomId}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`, '_blank');
                }}
            >
                <img
                    src={logoWhatsapp}
                    alt="WhatsApp"
                    className="min-w-[36px] min-h-[36px] object-contain block"
                />
            </a>

            {title || roomId}

            {/* Botón de Copiar */}
            <a
                className={`absolute right-full top-1/2 -translate-y-1/2 ${mrClass} flex-shrink-0 cursor-pointer text-white hover:text-gray-200 transition-colors`}
                onClick={handleCopy}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
            </a>

            <ToastNotification
                message="¡Enlace de la sala copiado!"
                isVisible={showToast}
            />
        </div>
    );
};

export default RoomShareHeader;
