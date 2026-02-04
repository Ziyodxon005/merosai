import { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiLiveClient } from '../services/GeminiLiveClient';
import { AudioStreamer } from '../services/AudioStreamer';

export function useGeminiLive() {
    const [isLive, setIsLive] = useState(false);
    const [volume, setVolume] = useState(0);
    const [isVisionEnabled, setIsVisionEnabled] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [personaState, setPersonaState] = useState('idle'); // 'idle' | 'greeting' | 'speaking'
    const [isAISpeaking, setIsAISpeaking] = useState(false);

    const clientRef = useRef(null);
    const audioStreamerRef = useRef(new AudioStreamer());
    const videoRef = useRef(null);
    const visionIntervalRef = useRef(null);
    const visionTimeoutRef = useRef(null);
    const isMicMutedRef = useRef(false);
    const greetingSentRef = useRef(false); // Track if greeting was already sent
    const speakingTimeoutRef = useRef(null); // Track speaking timeout
    const isGreetingRef = useRef(false); // Track if currently in greeting phase
    const currentApiKeyRef = useRef(1); // Track which API key is being used (1 or 2)
    const pendingReconnectRef = useRef(null); // Store pending reconnect params

    useEffect(() => {
        // Volume polling loop
        let interval;
        if (isLive && !isMicMuted) {
            interval = setInterval(() => {
                const vol = audioStreamerRef.current.getVolume();
                setVolume(vol);
            }, 50); // 20fps
        } else {
            setVolume(0);
        }
        return () => clearInterval(interval);
    }, [isLive, isMicMuted]);

    const requestMicPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionError(null);
            return true;
        } catch (error) {
            console.error("Mic permission denied", error);
            setPermissionError('mic');
            return false;
        }
    }, []);

    const connect = useCallback(async (apiKey, systemInstruction, voiceName = 'Kore', isRetry = false) => {
        // Reset greeting flag for new connection
        greetingSentRef.current = false;

        // Store connection params for potential retry
        pendingReconnectRef.current = { systemInstruction, voiceName };

        // Determine which API key to use
        let activeApiKey = apiKey;
        if (isRetry && currentApiKeyRef.current === 1) {
            const secondKey = import.meta.env.VITE_GEMINI_API_KEY2;
            if (secondKey) {
                console.log('⚠️ API Key 1 limit - switching to API Key 2...');
                currentApiKeyRef.current = 2;
                activeApiKey = secondKey;
            }
        }

        try {
            // First check mic permission
            const hasMicPermission = await requestMicPermission();
            if (!hasMicPermission) {
                alert("Mikrofon ruxsati kerak! Iltimos, mikrofon ruxsatini bering va qayta urinib ko'ring.");
                return;
            }

            const client = new GeminiLiveClient(activeApiKey);
            client.onAudioData = (base64Audio) => {
                audioStreamerRef.current.playAudioChunk(base64Audio);

                // AI is speaking - update persona state
                setIsAISpeaking(true);

                // Set appropriate state based on greeting phase
                if (isGreetingRef.current) {
                    console.log('🎤 Audio received - Setting state to GREETING');
                    setPersonaState('greeting');
                } else {
                    console.log('🎤 Audio received - Setting state to SPEAKING');
                    setPersonaState('speaking');
                }

                // Reset speaking timeout - if no audio for 1500ms, go back to idle
                if (speakingTimeoutRef.current) {
                    clearTimeout(speakingTimeoutRef.current);
                }
                speakingTimeoutRef.current = setTimeout(() => {
                    console.log('⏸️ No audio for 1500ms - Setting state to IDLE');
                    setIsAISpeaking(false);
                    setPersonaState('idle');
                    isGreetingRef.current = false; // Greeting is done
                }, 1500);
            };

            client.onOpen = async () => {
                setIsLive(true);
                // Start recording microphone
                try {
                    await audioStreamerRef.current.startRecording((base64Input) => {
                        if (!isMicMutedRef.current) {
                            client.sendAudioChunk(base64Input);
                        }
                    });

                    // Trigger greeting after connection - ask AI to introduce itself (ONLY ONCE)
                    if (!greetingSentRef.current) {
                        greetingSentRef.current = true;
                        isGreetingRef.current = true; // Mark as greeting phase
                        setTimeout(() => {
                            console.log('Sending greeting trigger (once)...');
                            client.sendTextMessage("Salom! O'zingizni tanishtiring.");
                        }, 500);
                    }

                } catch (error) {
                    console.error("Mic recording error", error);
                    setPermissionError('mic');
                    alert("Mikrofon ishlamayapti. Iltimos, mikrofon ruxsatini tekshiring.");
                }
            };

            client.onClose = (event) => {
                console.log('WebSocket closed:', event?.code, event?.reason);
                setIsLive(false);
                audioStreamerRef.current.stop();
                stopVision();

                // Check if rate limit error (code 1008 or reason contains rate/limit/quota)
                const reason = event?.reason?.toLowerCase() || '';
                const isRateLimit = event?.code === 1008 ||
                    reason.includes('rate') ||
                    reason.includes('limit') ||
                    reason.includes('quota') ||
                    reason.includes('resource_exhausted');

                // Auto-retry with second key if rate limited and first key was used
                if (isRateLimit && currentApiKeyRef.current === 1 && pendingReconnectRef.current) {
                    const { systemInstruction, voiceName } = pendingReconnectRef.current;
                    const secondKey = import.meta.env.VITE_GEMINI_API_KEY2;
                    if (secondKey) {
                        console.log('🔄 Rate limited - auto-retrying with API Key 2...');
                        setTimeout(() => {
                            connect(secondKey, systemInstruction, voiceName, true);
                        }, 1000);
                    }
                }
            };

            client.connect(systemInstruction, voiceName);
            clientRef.current = client;

        } catch (error) {
            console.error("Connection failed", error);
            setIsLive(false);
        }
    }, [isMicMuted]);

    const disconnect = useCallback(() => {
        console.log('Disconnect: Fully stopping mic, camera, and connection');

        // Stop microphone completely
        audioStreamerRef.current.stop();

        // Stop camera/vision
        stopVision();

        // Clear speaking timeout
        if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = null;
        }

        // Close WebSocket connection
        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }

        // Reset states
        setIsLive(false);
        setIsMicMuted(false);
        isMicMutedRef.current = false;
        setPersonaState('idle');
        setIsAISpeaking(false);
        isGreetingRef.current = false;
    }, []);

    const toggleMic = useCallback(() => {
        console.log('toggleMic called, current state:', isMicMutedRef.current);

        if (!isMicMutedRef.current) {
            // MUTE - Only pause microphone recording (AI audio continues)
            console.log('PAUSING microphone only (audio output continues)...');
            isMicMutedRef.current = true;
            setIsMicMuted(true);
            audioStreamerRef.current.pauseRecording();
            console.log('Microphone PAUSED');
        } else {
            // UNMUTE - Resume microphone recording
            console.log('RESUMING microphone...');
            isMicMutedRef.current = false;
            setIsMicMuted(false);
            audioStreamerRef.current.resumeRecording();
            console.log('Microphone RESUMED');
        }
    }, []);

    const startVision = useCallback(async () => {
        if (!videoRef.current || !clientRef.current || !isLive) return;

        try {
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });

            setIsVisionEnabled(true);
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            // Capture loop every 1.5s
            visionIntervalRef.current = setInterval(() => {
                captureAndSendFrame();
            }, 1500);

            // Auto-stop after 10 seconds
            visionTimeoutRef.current = setTimeout(() => {
                stopVision();
            }, 10000);
        } catch (err) {
            console.error("Camera error", err);
            setPermissionError('camera');
            alert("Kamera ruxsati kerak! Iltimos, kamera ruxsatini bering va qayta urinib ko'ring.");
        }
    }, [isLive]);

    const stopVision = useCallback(() => {
        setIsVisionEnabled(false);
        if (visionIntervalRef.current) {
            clearInterval(visionIntervalRef.current);
            visionIntervalRef.current = null;
        }
        if (visionTimeoutRef.current) {
            clearTimeout(visionTimeoutRef.current);
            visionTimeoutRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    const captureAndSendFrame = () => {
        const video = videoRef.current;
        if (!video.videoWidth) return;

        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 480 / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        if (clientRef.current) {
            clientRef.current.sendVideoFrame(base64);
        }
    };

    const toggleVision = useCallback(() => {
        if (isVisionEnabled) {
            stopVision();
        } else {
            startVision();
        }
    }, [isVisionEnabled, startVision, stopVision]);

    return {
        isLive,
        volume,
        connect,
        disconnect,
        videoRef,
        isVisionEnabled,
        toggleVision,
        isMicMuted,
        toggleMic,
        permissionError,
        personaState,
        isAISpeaking
    };
}

