import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HologramStage from './HologramStage';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { PERSONAS } from '../utils/personas';
import { PERSONA_DATA } from './WelcomePage';
import { Mic, MicOff, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';
import Particles from './Particles';

const ConversationPage = ({ personaId, onBack }) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const {
        isLive,
        volume,
        connect,
        disconnect,
        videoRef,
        isVisionEnabled,
        toggleVision,
        isMicMuted,
        toggleMic,
        personaState
    } = useGeminiLive();

    const persona = PERSONAS[personaId];
    const personaInfo = PERSONA_DATA.find(p => p.id === personaId);

    // Auto-connect when page opens (run once on mount)
    useEffect(() => {
        if (apiKey && persona) {
            console.log('ConversationPage: Connecting to persona...');
            connect(apiKey, persona.systemInstruction, persona.voice);
        }

        // Cleanup on unmount ONLY - stop everything
        return () => {
            console.log('ConversationPage: Unmounting, stopping all...');
            disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array - run only once on mount

    const handleDisconnect = () => {
        disconnect();
        onBack();
    };

    return (
        <motion.div
            className="conversation-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Particles />

            {/* Header */}
            <header className="conversation-header">
                <motion.button
                    className="back-button"
                    onClick={handleDisconnect}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={20} />
                    <span>Orqaga</span>
                </motion.button>

                <div className="conversation-title">
                    <h2 className="gold-calligraphy">{personaInfo?.name}</h2>
                    <p>{personaInfo?.role}</p>
                </div>

                <div className={`status-badge ${isLive ? 'live' : 'offline'}`}>
                    <span className="status-dot"></span>
                    <span className="status-text">{isLive ? 'JONLI ALOQA' : 'ULANMOQDA...'}</span>
                </div>
            </header>

            {/* Main Stage - Full Area */}
            <div className="conversation-stage">
                <HologramStage
                    currentPersonaId={personaId}
                    volume={volume}
                    isLive={isLive}
                    isVisionEnabled={isVisionEnabled}
                    videoRef={videoRef}
                    personaName={personaInfo?.name || ''}
                    personaState={personaState}
                />
            </div>

            {/* Controls - Overlay at Bottom */}
            <div className="conversation-controls">
                {/* Vision Toggle */}
                <motion.button
                    onClick={toggleVision}
                    className={`btn-icon ${isVisionEnabled ? 'active' : ''}`}
                    title="Meni Ko'ring (15 soniya)"
                    whileTap={{ scale: 0.95 }}
                    disabled={!isLive}
                    style={{ opacity: isLive ? 1 : 0.5 }}
                >
                    {isVisionEnabled ? <Eye size={22} /> : <EyeOff size={22} />}
                </motion.button>

                {/* Mic Toggle */}
                <motion.button
                    onClick={toggleMic}
                    className={`mic-indicator ${isMicMuted ? 'muted' : ''}`}
                    title={isMicMuted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        boxShadow: isLive && !isMicMuted ? '0 0 30px rgba(0, 243, 255, 0.5)' : 'none',
                        borderColor: isMicMuted ? '#ff5555' : (isLive ? '#00f3ff' : 'rgba(212, 175, 55, 0.4)'),
                    }}
                >
                    {isMicMuted ? (
                        <MicOff size={26} style={{ color: '#ff5555' }} />
                    ) : (
                        <Mic size={26} style={{ color: isLive ? '#00f3ff' : '#d4af37' }} />
                    )}
                    {isLive && !isMicMuted && <span className="mic-pulse"></span>}
                </motion.button>

                {/* End Call */}
                <motion.button
                    onClick={handleDisconnect}
                    className="btn-end-call"
                    title="Aloqani tugatish"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <X size={22} />
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ConversationPage;

