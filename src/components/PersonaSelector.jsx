import React from 'react';
import { ScrollText, Crown, Landmark, Users } from 'lucide-react';

const PERSONAS = [
    { id: 'navoi', name: 'Alisher Navoiy', role: 'Shoir va Mutafakkir', icon: ScrollText },
    { id: 'temur', name: 'Amir Temur', role: 'Buyuk Sarkarda', icon: Crown },
    { id: 'babur', name: 'Bobur', role: 'Shoir va Sarkarda', icon: Landmark },
    { id: 'karimov', name: 'Islom Karimov', role: 'Birinchi Prezident', icon: Users },
];

const PersonaSelector = ({ currentPersona, onSelect }) => {
    return (
        <div className="glass-panel-heavy p-6 flex flex-col gap-4 w-full max-w-md">
            <h3 className="text-center text-xs uppercase tracking-widest" style={{ color: '#888' }}>
                Muloqotdoshingizni tanlang
            </h3>
            <div className="flex justify-center gap-4">
                {PERSONAS.map((persona) => {
                    const Icon = persona.icon;
                    const isActive = currentPersona === persona.id;
                    return (
                        <button
                            key={persona.id}
                            onClick={() => onSelect(persona.id)}
                            className={`persona-btn ${isActive ? 'active' : ''}`}
                            title={persona.name}
                        >
                            <Icon size={22} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export { PERSONAS };
export default PersonaSelector;
