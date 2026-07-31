import { useState, useEffect } from 'react';
import { Building2, User, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getActiveFinancialYear } from '../../utils/financialYearUtils';

const Footer = ({ companyName }) => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeFY, setActiveFY] = useState(() => getActiveFinancialYear());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        const handleFYChange = (e) => {
            if (e.detail) {
                setActiveFY(e.detail);
            } else {
                setActiveFY(getActiveFinancialYear());
            }
        };

        window.addEventListener('financial_year_changed', handleFYChange);
        return () => {
            clearInterval(timer);
            window.removeEventListener('financial_year_changed', handleFYChange);
        };
    }, []);

    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const displayCompany = companyName || user?.restaurant_name || user?.name || user?.company_name || 'KONGU BIRIYANI';
    const displayUser = user?.name || user?.username || user?.role || 'Admin';

    const fyString = activeFY?.label ? activeFY.label.replace(/to/i, 'To') : '01-04-2026 To 31-03-2027';

    return (
        <footer
            style={{
                height: '54px',
                minHeight: '54px',
                maxHeight: '54px',
                backgroundColor: '#0F172A',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 90,
                flexShrink: 0,
                width: '100%',
                fontSize: '12px',
                fontWeight: 700
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                    <span style={{ color: '#f97316', fontWeight: 900, letterSpacing: '0.02em' }}>Company :</span>
                    <span style={{ color: '#ffffff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{displayCompany}</span>
                </div>

                <div style={{ height: '16px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 8px' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                    <span style={{ color: '#f97316', fontWeight: 900, letterSpacing: '0.02em' }}>User :</span>
                    <span style={{ color: '#ffffff', fontWeight: 900, textTransform: 'capitalize', letterSpacing: '0.02em' }}>{displayUser}</span>
                </div>

                <div style={{ height: '16px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 8px' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                    <span style={{ color: '#f97316', fontWeight: 900, letterSpacing: '0.02em' }}>Financial Year :</span>
                    <span style={{ color: '#ffffff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{fyString}</span>
                </div>

                <div style={{ height: '16px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 8px' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                    <span style={{ color: '#f97316', fontWeight: 900, letterSpacing: '0.02em' }}>Date :</span>
                    <span style={{ color: '#ffffff', fontWeight: 900, letterSpacing: '0.02em' }}>{formattedDate}</span>
                </div>

                <div style={{ height: '16px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)', margin: '0 8px' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                    <span style={{ color: '#f97316', fontWeight: 900, letterSpacing: '0.02em' }}>Time :</span>
                    <span style={{ color: '#ffffff', fontWeight: 900, letterSpacing: '0.02em' }}>{formattedTime}</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
