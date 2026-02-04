import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import WelcomePage from './components/WelcomePage';
import ConversationPage from './components/ConversationPage';
import './App.css';

function App() {
    const [currentPage, setCurrentPage] = useState('splash');
    const [selectedPersona, setSelectedPersona] = useState(null);

    const handleSplashComplete = () => {
        setCurrentPage('welcome');
    };

    const handleSelectPersona = (personaId) => {
        setSelectedPersona(personaId);
        setCurrentPage('conversation');
    };

    const handleBack = () => {
        setCurrentPage('welcome');
        setSelectedPersona(null);
    };

    return (
        <div className="app">
            <AnimatePresence mode="wait">
                {currentPage === 'splash' ? (
                    <SplashScreen
                        key="splash"
                        onComplete={handleSplashComplete}
                    />
                ) : currentPage === 'welcome' ? (
                    <WelcomePage
                        key="welcome"
                        onSelectPersona={handleSelectPersona}
                    />
                ) : (
                    <ConversationPage
                        key="conversation"
                        personaId={selectedPersona}
                        onBack={handleBack}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
