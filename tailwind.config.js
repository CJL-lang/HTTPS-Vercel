export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    light: '#F3E5AB',
                    DEFAULT: '#D4AF37',
                    dark: '#B8860B',
                },
                dark: {
                    bg: '#0A0A0A',
                    card: '#1A1A1A',
                    border: '#333333',
                }
            },
            fontFamily: {
                sans: ['"Source Han Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

