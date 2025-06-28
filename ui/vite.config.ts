import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/*
Define a config for building the plugin UI. Figma requires a single HTML file as an output, so we need to inline every asset and merge everything into a single document.
 */
export default defineConfig({
  // Specify the source directory
  root: './ui',

  plugins: [
    // Enable working with React
    react(),

    // Merge everything into a single file
    viteSingleFile(),

    // Provide the support for SVG
    svgr()
  ],

  build: {
    // Set ES6 as a target, similar to Figma’s own example of tsconfig.js: https://www.figma.com/plugin-docs/libraries-and-bundling/#setup-typescript-with-webpack
    target: 'es6',

    // Specify the output folder and ask to rewrite upon each compilation
    outDir: '../dist/ui',
    emptyOutDir: true,

    // Inline every asset and load it as a single chunk
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,

    // Disable CSS code splitting and load all the styles in advance
    cssCodeSplit: false
  },

  // Ensure Vite is using modern JS API for SCSS. See more here: https://sass-lang.com/documentation/breaking-changes/legacy-js-api/#bundlers
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' } }
  }
})