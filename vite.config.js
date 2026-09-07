import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({envDir:fileURLToPath(new URL('../../',import.meta.url)),server:{port:5173,proxy:{'/api':'http://localhost:3001'}},build:{target:'es2022'}});
