/** @type {import('tailwindcss').Config} */
export default {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
                'scale-in': 'scale-in 0.3s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'bounce-soft': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'scale-in': {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                light: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    accent: '#06b6d4',
                    neutral: '#374151',
                    'base-100': '#ffffff',
                    info: '#0ea5e9',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                },
            },
            'dark',
            'cupcake',
            'bumblebee',
            'emerald',
            'corporate',
            'synthwave',
            'retro',
            'cyberpunk',
            'valentine',
            'halloween',
            'garden',
            'forest',
            'aqua',
            'lofi',
            'pastel',
            'fantasy',
            'wireframe',
            'black',
            'luxury',
            'dracula',
            'cmyk',
            'autumn',
            'business',
            'acid',
            'lemonade',
            'night',
            'coffee',
            'winter',
        ],
    },
}
