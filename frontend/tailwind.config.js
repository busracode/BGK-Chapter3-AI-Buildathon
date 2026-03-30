/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        forest: 'var(--color-forest)',
        grass: 'var(--color-grass)',
        mintLight: 'var(--color-mint-light)',
        mintBorder: 'var(--color-mint-border)',
        mintMid: 'var(--color-mint-mid)',
        sage: 'var(--color-sage)',
        warmBg: 'var(--color-warm-bg)',
        borderSoft: 'var(--color-border-soft)',
        textMain: 'var(--color-text-main)',
        textMid: 'var(--color-text-mid)',
        textMuted: 'var(--color-text-muted)',
        textFaint: 'var(--color-text-faint)',
        goldBg: 'var(--color-gold-bg)',
        goldText: 'var(--color-gold-text)',
        goldIcon: 'var(--color-gold-icon)',
        purpleBg: 'var(--color-purple-bg)',
        purpleText: 'var(--color-purple-text)',
        purpleIcon: 'var(--color-purple-icon)',
      },
      boxShadow: {
        none: 'none'
      }
    },
  },
  plugins: [],
}
