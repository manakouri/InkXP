import React from 'https://aistudiocdn.com/react@^19.2.0';
import { createRoot } from 'https://aistudiocdn.com/react-dom@^19.2.0/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
