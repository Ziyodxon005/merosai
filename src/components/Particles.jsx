import React from 'react';

const Particles = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 20}s`,
        duration: `${15 + Math.random() * 10}s`,
        size: `${1 + Math.random() * 2}px`,
    }));

    return (
        <div className="particles">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        width: p.size,
                        height: p.size,
                    }}
                />
            ))}
        </div>
    );
};

export default Particles;
