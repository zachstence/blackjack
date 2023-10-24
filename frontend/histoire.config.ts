import { defineConfig } from 'histoire';
import { HstSvelte } from '@histoire/plugin-svelte';

export default defineConfig({
  plugins: [HstSvelte()],
  setupFile: '/src/histoire/histoire.setup.ts',
});
