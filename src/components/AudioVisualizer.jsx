import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ volume, isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let phase = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerY = canvas.height / 2;
            const amplitude = isActive ? 15 + volume * 40 : 5;
            const frequency = 0.02;

            // Gold gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(212, 175, 55, 0)');
            gradient.addColorStop(0.5, `rgba(212, 175, 55, ${isActive ? 0.8 : 0.3})`);
            gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

            ctx.beginPath();
            ctx.moveTo(0, centerY);

            for (let x = 0; x < canvas.width; x++) {
                const y = centerY + Math.sin((x * frequency) + phase) * amplitude * Math.sin((x / canvas.width) * Math.PI);
                ctx.lineTo(x, y);
            }

            ctx.strokeStyle = gradient;
            ctx.lineWidth = isActive ? 2 + volume * 3 : 1;
            ctx.shadowBlur = isActive ? 15 + volume * 20 : 5;
            ctx.shadowColor = '#d4af37';
            ctx.stroke();

            // Second wave (offset)
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            for (let x = 0; x < canvas.width; x++) {
                const y = centerY + Math.sin((x * frequency * 1.5) + phase + 1) * amplitude * 0.6 * Math.sin((x / canvas.width) * Math.PI);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0, 243, 255, ${isActive ? 0.4 : 0.1})`;
            ctx.lineWidth = 1;
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 10;
            ctx.stroke();

            phase += 0.05;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationFrameId);
    }, [volume, isActive]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default AudioVisualizer;
