import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const filePath = fileURLToPath(new URL('package.json', import.meta.url));
const packageJson = JSON.parse(readFileSync(filePath, 'utf8'));

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    PACKAGE_JSON: packageJson
  }
});
