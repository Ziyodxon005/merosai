import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 10000); // 10 soniya

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
        >
            <div className="splash-content">
                <motion.img
                    src="/logo.png"
                    alt="Logo"
                    className="splash-logo"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />

                <motion.p
                    className="splash-quote"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 1 }}
                >
                    Hech qachon bo'sh kelmang aziz bolalarim ertangi kun bizniki, kelejak marra bizniki...
                </motion.p>

                <motion.h2
                    className="splash-author"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.5, duration: 1 }}
                >
                    ISLOM KARIMOV
                </motion.h2>

                <motion.p
                    className="splash-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3, duration: 1 }}
                >
                    O'zbekiston Respublikasi Birinchi Prezidenti
                </motion.p>
            </div>
        </motion.div>
    );
};

export default SplashScreen;
