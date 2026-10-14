import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import '@astryxdesign/theme-neutral/fonts.css';

import {App} from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('index.html must provide an element with id "root"');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
