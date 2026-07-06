/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                /* ── Steel-Blue Primary ── */
                primary: {
                    50: '#f0f7ff',
                    100: '#dbeafe',
                    200: '#bcd4ed',
                    300: '#9bbcd9',
                    400: '#7ea1c4',
                    500: '#7ea1c4',   // Main brand blue
                    600: '#5788b7',   // Hover shade
                    700: '#3d6d9b',
                    800: '#2c527a',
                    900: '#1e3a5c',
                },

                /* ── Remap indigo → steel-blue so all old indigo-* classes work ── */
                indigo: {
                    50: '#f0f7ff',
                    100: '#dbeafe',
                    200: '#bcd4ed',
                    300: '#9bbcd9',
                    400: '#7ea1c4',
                    500: '#7ea1c4',
                    600: '#5788b7',
                    700: '#3d6d9b',
                    800: '#2c527a',
                    900: '#1e3a5c',
                },

                /* ── Remap purple → muted steel-blue ── */
                purple: {
                    50: '#f0f7ff',
                    100: '#dbeafe',
                    200: '#bcd4ed',
                    300: '#9bbcd9',
                    400: '#7ea1c4',
                    500: '#7ea1c4',
                    600: '#5788b7',
                    700: '#3d6d9b',
                    800: '#2c527a',
                    900: '#1e3a5c',
                },

                /* ── Dark navy ── */
                galaxy: {
                    DEFAULT: '#0F172A',
                    secondary: '#334155',
                    muted: '#64748B',
                },

                /* ── Background surfaces ── */
                background: {
                    primary: '#FFFFFF',
                    secondary: '#F1F5F9',
                },

                /* ── Named aliases for the theme ── */
                brand: {
                    navy: '#0F172A',
                    blue: '#7ea1c4',
                    'blue-dk': '#5788b7',
                    'blue-lt': '#f0f7ff',
                },
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
                sans: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '20px',
                '4xl': '24px',
                '5xl': '32px',
            },
            boxShadow: {
                'steel': '0 4px 20px rgba(126, 161, 196, 0.2)',
                'steel-lg': '0 10px 40px rgba(126, 161, 196, 0.25)',
                'navy': '0 4px 20px rgba(15, 23, 42, 0.15)',
            },
        },
    },
    plugins: [],
}
