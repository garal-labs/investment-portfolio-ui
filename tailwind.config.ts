// Tailwind v4: los tokens de diseño (colores, tipografía, radios) se definen
// en @theme dentro de globals.css. Este archivo solo configura el scanner de clases.
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
}

export default config
