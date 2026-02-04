export class GeminiLiveClient {
    constructor(apiKey, model = "models/gemini-2.5-flash-native-audio-preview-12-2025") {
        this.apiKey = apiKey;
        this.model = model;
        this.ws = null;
        this.onAudioData = null;
        this.onOpen = null;
        this.onClose = null;
        this.onError = null;
    }

    connect(systemInstruction, voiceName = 'Kore') {
        this.voiceName = voiceName;
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log("Connected to Gemini Live");
            this.sendSetup(systemInstruction);
            if (this.onOpen) this.onOpen();
        };

        this.ws.onmessage = async (event) => {
            let data = event.data;
            if (data instanceof Blob) {
                data = await data.text();
            }

            try {
                const response = JSON.parse(data);
                this.handleMessage(response);
            } catch (e) {
                console.error("Error parsing message", e);
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket Error", error);
            if (this.onError) this.onError(error);
        };

        this.ws.onclose = (event) => {
            console.log("Disconnected", event.code, event.reason);
            if (this.onClose) this.onClose(event);
        };
    }

    sendSetup(systemInstruction) {
        const setupMessage = {
            setup: {
                model: this.model,
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: this.voiceName
                            }
                        }
                    }
                },
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                }
            }
        };
        this.ws.send(JSON.stringify(setupMessage));
    }

    sendAudioChunk(base64Audio) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                realtime_input: {
                    media_chunks: [
                        {
                            mime_type: "audio/pcm;rate=16000",
                            data: base64Audio
                        }
                    ]
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    sendVideoFrame(base64Image) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                realtime_input: {
                    media_chunks: [
                        {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    ]
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    sendTextMessage(text) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = {
                client_content: {
                    turns: [{
                        role: "user",
                        parts: [{ text: text }]
                    }],
                    turn_complete: true
                }
            };
            this.ws.send(JSON.stringify(msg));
        }
    }

    handleMessage(response) {
        if (response.serverContent && response.serverContent.modelTurn) {
            const parts = response.serverContent.modelTurn.parts;
            for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/pcm")) {
                    if (this.onAudioData) {
                        this.onAudioData(part.inlineData.data);
                    }
                }
            }
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
