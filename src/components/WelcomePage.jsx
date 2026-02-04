import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Crown, Landmark, Users, ArrowRight } from 'lucide-react';

const PERSONA_DATA = [
    {
        id: 'navoi',
        name: 'Alisher Navoiy',
        role: 'Shoir va Mutafakkir',
        icon: ScrollText,
        image: '/alisher.png',
        color: '#d4af37',
        description: 'Temuriylar davri buyuk shoiri va mutafakkiri bilan adabiyot, san\'at va insoniyat haqida suhbatlashing.'
    },
    {
        id: 'temur',
        name: 'Amir Temur',
        role: 'Buyuk Sarkarda',
        icon: Crown,
        image: '/temur.png',
        color: '#ff6b35',
        description: 'Temuriylar imperiyasining asoschisi bilan rahbarlik, intizom va adolat haqida gaplashing.'
    },
    {
        id: 'babur',
        name: 'Zahiriddin Bobur',
        role: 'Shoir va Sarkarda',
        icon: Landmark,
        image: '/bobur.png',
        color: '#4ecdc4',
        description: 'Boburnoma muallifi bilan tabiat go\'zalligi, bog\'lar va Vatan sog\'inchi haqida suhbat quring.'
    },
    {
        id: 'karimov',
        name: 'Islom Karimov',
        role: 'Birinchi Prezident',
        icon: Users,
        image: '/islom_karimov.png',
        color: '#1e90ff',
        description: 'Mustaqil O\'zbekistonning birinchi Prezidenti bilan Buyuk Kelajak haqida gaplashing.'
    },
];

const WelcomePage = ({ onSelectPersona }) => {
    return (
        <div className="welcome-page">
            {/* Header */}
            <motion.div
                className="welcome-header"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 className="gold-calligraphy text-4xl mb-2">MEROS AI</h1>
                <p className="welcome-subtitle">Buyuk Ajdodlarimiz Bilan Muloqot</p>
            </motion.div>

            {/* Persona Cards */}
            <div className="persona-grid">
                {PERSONA_DATA.map((persona, index) => {
                    const Icon = persona.icon;
                    return (
                        <motion.div
                            key={persona.id}
                            className="persona-card"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -5 }}
                            onClick={() => onSelectPersona(persona.id)}
                            style={{ '--accent-color': persona.color }}
                        >
                            <div className="persona-card-icon">
                                <img
                                    src={persona.image}
                                    alt={persona.name}
                                    className="persona-image"
                                />
                            </div>
                            <h3 className="persona-card-name">{persona.name}</h3>
                            <p className="persona-card-role">{persona.role}</p>
                            <p className="persona-card-desc">{persona.description}</p>
                            <div className="persona-card-action">
                                <span>Muloqotni boshlash</span>
                                <ArrowRight size={18} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer */}
            <motion.footer
                className="welcome-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <p>TURON o'quv markazi tomonidan ishlab chiqilgan</p>
            </motion.footer>
        </div>
    );
};

export { PERSONA_DATA };
export default WelcomePage;
