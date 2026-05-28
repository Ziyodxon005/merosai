import React from 'react';
import { Analytics } from '@vercel/analytics/react';

const Layout = ({ children }) => {
    return (
        <div className="app-container">
            {children}
            <Analytics />
        </div>
    );
};

export default Layout;
