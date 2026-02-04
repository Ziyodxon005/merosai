import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import AudioVisualizer from './AudioVisualizer';

// Video sources for each persona
const PERSONA_VIDEOS = {
    navoi: {
        idle: '/alisher 1.mp4',
        greeting: '/alisher 2.mp4',
        speaking: '/alisher 3.mp4'
    },
    temur: {
        idle: '/temur 1.mp4',
        greeting: '/temur 1.mp4',
        speaking: '/temur 1.mp4'
    },
    babur: {
        idle: '/bobur 1.mp4',
        greeting: '/bobur 1.mp4',
        speaking: '/bobur 1.mp4'
    },
    karimov: {
        idle: '/islom karimov 1.mp4',
        greeting: '/islom karimov 1.mp4',
        speaking: '/islom karimov 1.mp4'
    }
};

const HologramStage = ({
    currentPersonaId,
    volume,
    isLive,
    isVisionEnabled,
    videoRef,
    personaName,
    personaState = 'idle'
}) => {
    const idleVideoRef = useRef(null);
    const greetingVideoRef = useRef(null);
    const speakingVideoRef = useRef(null);

    // Get video sources for current persona
    const videoSources = PERSONA_VIDEOS[currentPersonaId] || PERSONA_VIDEOS.navoi;

    // Play/pause videos based on personaState
    useEffect(() => {
        console.log('🎬 HologramStage personaState:', personaState, 'isLive:', isLive, 'persona:', currentPersonaId);

        const videos = {
            idle: idleVideoRef.current,
            greeting: greetingVideoRef.current,
            speaking: speakingVideoRef.current
        };

        // Play the active video, pause others
        Object.entries(videos).forEach(([state, video]) => {
            if (video) {
                if (state === personaState && isLive) {
                    console.log('▶️ Playing video:', state);
                    video.play().catch(err => console.log('Video autoplay blocked:', err));
                } else {
                    video.pause();
                }
            }
        });
    }, [personaState, isLive, currentPersonaId]);

    // Preload all videos when live
    useEffect(() => {
        if (isLive) {
            [idleVideoRef, greetingVideoRef, speakingVideoRef].forEach(ref => {
                if (ref.current) {
                    ref.current.load();
                }
            });
        }
    }, [isLive]);

    return (
        <motion.div
            className="hologram-container materialize-enter"
            animate={{ y: [0, -15, 0] }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            key={currentPersonaId}
        >
            {/* Scanning Line (Vision Mode) */}
            {isVisionEnabled && <div className="scanning-line" />}

            {/* Character Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                {/* Animation Videos - Stacked with alpha transitions */}
                <motion.div
                    className="character-video-container"
                    animate={{ scale: 1 + volume * 0.15 }}
                    transition={{ duration: 0.1 }}
                    style={{ position: 'relative' }}
                >
                    {/* Idle Video */}
                    <video
                        ref={idleVideoRef}
                        src={videoSources.idle}
                        muted
                        loop
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            opacity: personaState === 'idle' ? 1 : 0,
                            transition: 'opacity 0.5s ease-in-out',
                            filter: isLive ? 'none' : 'grayscale(50%) brightness(0.7)',
                        }}
                    />

                    {/* Greeting Video */}
                    <video
                        ref={greetingVideoRef}
                        src={videoSources.greeting}
                        muted
                        loop
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            opacity: personaState === 'greeting' ? 1 : 0,
                            transition: 'opacity 0.5s ease-in-out',
                            filter: isLive ? 'none' : 'grayscale(50%) brightness(0.7)',
                        }}
                    />

                    {/* Speaking Video */}
                    <video
                        ref={speakingVideoRef}
                        src={videoSources.speaking}
                        muted
                        loop
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            opacity: personaState === 'speaking' ? 1 : 0,
                            transition: 'opacity 0.5s ease-in-out',
                            filter: isLive ? 'none' : 'grayscale(50%) brightness(0.7)',
                        }}
                    />

                    {/* Invisible spacer to maintain container size */}
                    <div style={{ width: '100%', paddingBottom: '100%' }} />
                </motion.div>

                {/* Character Name */}
                <h2 className="gold-calligraphy text-2xl mt-6 text-center">
                    {personaName}
                </h2>

                {/* Status Text */}
                <p className="text-xs tracking-widest mt-4" style={{ color: isLive ? '#00f3ff' : '#666' }}>
                    {isLive
                        ? (isVisionEnabled ? 'KO\'RISH FAOL' : 'OVOZ ALOQASI')
                        : 'KUTILMOQDA'}
                </p>
            </div>

            {/* Audio Visualizer at Base */}
            <div className="visualizer-base">
                <AudioVisualizer volume={volume} isActive={isLive} />
            </div>

            {/* Vision Video Preview */}
            <video
                ref={videoRef}
                className="vision-preview"
                style={{ opacity: isVisionEnabled ? 1 : 0, pointerEvents: isVisionEnabled ? 'auto' : 'none' }}
                muted
            />
        </motion.div>
    );
};

export default HologramStage;
