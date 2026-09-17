import { createRoot } from 'react-dom/client';
import App from './App';
import './local/studio.css';
// This test client loads no auth SDK, cloud database client or service worker.
createRoot(document.getElementById('root')!).render(<App />);
