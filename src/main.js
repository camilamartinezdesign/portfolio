// Entry point loaded by index.html. Vite bundles everything imported here.
import './styles/main.css';
import './components/image-slot.js';
import './components/video-slot.js';
import { initLanding } from './scripts/landing.js';

initLanding();
