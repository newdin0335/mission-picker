// postcss.config.js (v4 스타일, CJS로 유지해도 됨)
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},   // ✅ 핵심: tailwindcss → @tailwindcss/postcss
  },
};
