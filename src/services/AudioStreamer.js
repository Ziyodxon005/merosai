export class AudioStreamer {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.workletNode = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.inputSampleRate = 16000;
        this.outputSampleRate = 24000;
        this.audioQueue = [];
        this.scheduledTime = 0;
        this.analyser = null;
        this.onVolumeChange = null;
        this.isPaused = false;
        this.onDataCallback = null;
        this.activeSources = []; // Track all active audio sources
        this.lastAudioTime = 0; // Track when last audio was received
    }

    async initialize() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.inputSampleRate,
        });

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        await this.audioContext.audioWorklet.addModule(
            URL.createObjectURL(
                new Blob(
                    [
                        `
            class PCMProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.bufferSize = 4096;
              }
              process(inputs, outputs, parameters) {
                const input = inputs[0];
                if (input && input.length > 0) {
                  const channelData = input[0];
                  if (channelData) {
                    this.port.postMessage(channelData);
                  }
                }
                return true;
              }
            }
            registerProcessor("pcm-processor", PCMProcessor);
            `,
                    ],
                    { type: "application/javascript" }
                )
            )
        );
    }

    async startRecording(onDataAvailable) {
        console.log('AudioStreamer.startRecording(): Starting...');
        if (!this.audioContext) await this.initialize();

        this.onDataCallback = onDataAvailable;
        this.isPaused = false;

        try {
            console.log('AudioStreamer.startRecording(): Requesting mic...');
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.inputSampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            console.log('AudioStreamer.startRecording(): Got mediaStream with', this.mediaStream.getTracks().length, 'tracks');

            if (!this.audioContext) {
                // Context was closed while we were waiting for permission
                this.mediaStream.getTracks().forEach(t => t.stop());
                return;
            }

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-processor");

            this.workletNode.port.onmessage = (event) => {
                if (this.isPaused) return; // Don't send data when paused
                const float32Array = event.data;
                const int16Array = this.convertFloat32ToInt16(float32Array);
                if (this.onDataCallback) {
                    this.onDataCallback(btoa(String.fromCharCode(...new Uint8Array(int16Array.buffer))));
                }
            };

            source.connect(this.workletNode);
            this.workletNode.connect(this.analyser); // For visualizer inputs (user voice)
        } catch (error) {
            console.error("Error accessing microphone:", error);
            throw error;
        }
    }

    pauseRecording() {
        console.log('AudioStreamer: PAUSING microphone (disabling tracks)');
        this.isPaused = true;

        // Just disable tracks, don't stop them
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                console.log('AudioStreamer: Disabling track', track.label);
                track.enabled = false;
            });
        }

        console.log('AudioStreamer: Microphone PAUSED');
    }

    resumeRecording() {
        console.log('AudioStreamer: RESUMING microphone (enabling tracks)');
        this.isPaused = false;

        // Just enable tracks
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                console.log('AudioStreamer: Enabling track', track.label);
                track.enabled = true;
            });
        }

        console.log('AudioStreamer: Microphone RESUMED');
    }

    // Clear all queued and playing audio (for interruption)
    clearAudioQueue() {
        console.log('AudioStreamer: Clearing audio queue');
        // Stop all active sources
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Source may have already ended
            }
        });
        this.activeSources = [];
        this.audioQueue = [];
        this.scheduledTime = this.audioContext ? this.audioContext.currentTime : 0;
    }

    playAudioChunk(base64Audio) {
        if (!this.audioContext) return;

        const currentTime = Date.now();
        // If more than 1 second gap, this is a new response - clear old audio
        if (currentTime - this.lastAudioTime > 1000 && this.activeSources.length > 0) {
            console.log('AudioStreamer: New response detected, clearing old audio');
            this.clearAudioQueue();
        }
        this.lastAudioTime = currentTime;

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768; // Convert Int16 to Float32
        }

        const buffer = this.audioContext.createBuffer(1, float32Array.length, this.outputSampleRate);
        buffer.copyToChannel(float32Array, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // Track this source
        this.activeSources.push(source);
        source.onended = () => {
            const idx = this.activeSources.indexOf(source);
            if (idx > -1) this.activeSources.splice(idx, 1);
        };

        // Connect to analyser for "AI Voice" visualization
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Simple scheduling to play sequentially
        const audioCurrentTime = this.audioContext.currentTime;
        if (this.scheduledTime < audioCurrentTime) {
            this.scheduledTime = audioCurrentTime;
        }

        source.start(this.scheduledTime);
        this.scheduledTime += buffer.duration;
    }

    stop() {
        console.log('AudioStreamer.stop(): Stopping all audio...');

        // Stop all microphone tracks
        if (this.mediaStream) {
            const tracks = this.mediaStream.getTracks();
            console.log('AudioStreamer.stop(): Stopping', tracks.length, 'tracks');
            tracks.forEach((track) => {
                console.log('AudioStreamer.stop(): Stopping track:', track.label, track.readyState);
                track.stop();
            });
            this.mediaStream = null;
        }

        // Disconnect worklet
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Clear active sources
        this.activeSources.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        this.activeSources = [];

        this.isPaused = false;
        this.onDataCallback = null;
        console.log('AudioStreamer.stop(): All audio stopped');
    }

    convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    getVolume() {
        if (!this.analyser || this.isPaused) return 0;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        return sum / dataArray.length / 255; // Normalized 0-1
    }
}

