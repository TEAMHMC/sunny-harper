/**
 * Sunny Harper Chat Widget - Embeddable Version
 *
 * Add this script to any page to enable the Sunny Harper chatbot:
 *
 * <script src="https://your-domain.com/sunny-harper.iife.js"></script>
 * <script>
 *   SunnyHarper.init({
 *     lang: 'en',  // 'en' or 'es'
 *     position: 'bottom-right',  // 'bottom-right' or 'bottom-left'
 *     primaryColor: '#233dff',  // Your brand color
 *   });
 * </script>
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { SunnyChat, SunnyConfig } from './SunnyChat';

// Inject styles
const injectStyles = () => {
  if (document.getElementById('sunny-harper-styles')) return;

  const style = document.createElement('style');
  style.id = 'sunny-harper-styles';
  style.textContent = `
    /* Sunny Harper Chat Widget Styles */
    .sunny-widget * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Force header text colors — override Webflow global styles */
    .sunny-widget .sunny-header-name {
      color: #fff !important;
    }
    .sunny-widget .sunny-header-status {
      color: rgba(255,255,255,0.8) !important;
    }

    .sunny-widget button {
      cursor: pointer;
      border: none;
      background: none;
      padding: 0;
      margin: 0;
    }

    .sunny-widget button svg {
      color: inherit !important;
    }

    .sunny-widget input {
      font-size: 16px; /* Prevents zoom on iOS */
    }

    /* Utility classes */
    .sunny-widget .fixed { position: fixed; }
    .sunny-widget .absolute { position: absolute; }
    .sunny-widget .relative { position: relative; }
    .sunny-widget .flex { display: flex; }
    .sunny-widget .flex-col { flex-direction: column; }
    .sunny-widget .flex-1 { flex: 1; }
    .sunny-widget .items-center { align-items: center; }
    .sunny-widget .justify-center { justify-content: center; }
    .sunny-widget .justify-end { justify-content: flex-end; }
    .sunny-widget .justify-start { justify-content: flex-start; }
    .sunny-widget .gap-1 { gap: 0.25rem; }
    .sunny-widget .gap-2 { gap: 0.5rem; }
    .sunny-widget .gap-3 { gap: 0.75rem; }
    .sunny-widget .gap-4 { gap: 1rem; }
    .sunny-widget .flex-wrap { flex-wrap: wrap; }
    .sunny-widget .overflow-hidden { overflow: hidden; }
    .sunny-widget .overflow-y-auto { overflow-y: auto; }
    .sunny-widget .space-y-4 > * + * { margin-top: 1rem; }
    .sunny-widget .w-full { width: 100%; }
    .sunny-widget .h-full { height: 100%; }
    .sunny-widget .min-w-0 { min-width: 0; }
    .sunny-widget .max-w-\\[85\\%\\] { max-width: 85%; }
    .sunny-widget .rounded-full { border-radius: 9999px; }
    .sunny-widget .rounded-2xl { border-radius: 1rem; }
    .sunny-widget .rounded-bl-md { border-bottom-left-radius: 0.375rem; }
    .sunny-widget .rounded-br-md { border-bottom-right-radius: 0.375rem; }
    .sunny-widget .border { border-width: 1px; }
    .sunny-widget .border-2 { border-width: 2px; }
    .sunny-widget .border-\\[1\\.5px\\] { border-width: 1.5px; }
    .sunny-widget .border-black { border-color: #000; }
    .sunny-widget .border-white { border-color: #fff; }
    .sunny-widget .border-gray-200 { border-color: #e5e7eb; }
    .sunny-widget .border-t { border-top-width: 1px; }
    .sunny-widget .border-b { border-bottom-width: 1px; }
    .sunny-widget .bg-white { background-color: #fff; }
    .sunny-widget .bg-gray-50 { background-color: #f9fafb; }
    .sunny-widget .bg-gray-100 { background-color: #f3f4f6; }
    .sunny-widget .bg-gray-200 { background-color: #e5e7eb; }
    .sunny-widget .bg-green-400 { background-color: #4ade80; }
    .sunny-widget .bg-green-500 { background-color: #22c55e; }
    .sunny-widget .bg-red-500 { background-color: #ef4444; }
    .sunny-widget .bg-yellow-100 { background-color: #fef3c7; }
    .sunny-widget .bg-yellow-500 { background-color: #eab308; }
    .sunny-widget .text-white { color: #fff; }
    .sunny-widget .text-gray-400 { color: #9ca3af; }
    .sunny-widget .text-gray-500 { color: #6b7280; }
    .sunny-widget .text-gray-600 { color: #4b5563; }
    .sunny-widget .text-gray-700 { color: #374151; }
    .sunny-widget .text-gray-800 { color: #1f2937; }
    .sunny-widget .text-yellow-800 { color: #854d0e; }
    .sunny-widget .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .sunny-widget .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .sunny-widget .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .sunny-widget .text-\\[10px\\] { font-size: 10px; }
    .sunny-widget .font-bold { font-weight: 700; }
    .sunny-widget .font-semibold { font-weight: 600; }
    .sunny-widget .uppercase { text-transform: uppercase; }
    .sunny-widget .tracking-wider { letter-spacing: 0.05em; }
    .sunny-widget .leading-relaxed { line-height: 1.625; }
    .sunny-widget .whitespace-pre-wrap { white-space: pre-wrap; }
    .sunny-widget .text-center { text-align: center; }
    .sunny-widget .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .sunny-widget .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
    .sunny-widget .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
    .sunny-widget .transition-all { transition: all 0.2s; }
    .sunny-widget .hover\\:scale-110:hover { transform: scale(1.1); }
    .sunny-widget .hover\\:bg-gray-200:hover { background-color: #e5e7eb; }
    .sunny-widget .hover\\:text-white:hover { color: #fff; }
    .sunny-widget .disabled\\:opacity-50:disabled { opacity: 0.5; }
    .sunny-widget .animate-pulse { animation: pulse 2s infinite; }
    .sunny-widget .animate-bounce { animation: bounce 1s infinite; }
    .sunny-widget .object-contain { object-fit: contain; }
    .sunny-widget .p-3 { padding: 0.75rem; }
    .sunny-widget .p-4 { padding: 1rem; }
    .sunny-widget .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
    .sunny-widget .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .sunny-widget .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .sunny-widget .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
    .sunny-widget .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .sunny-widget .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
    .sunny-widget .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .sunny-widget .mb-1 { margin-bottom: 0.25rem; }
    .sunny-widget .mb-2 { margin-bottom: 0.5rem; }
    .sunny-widget .mt-2 { margin-top: 0.5rem; }
    .sunny-widget .z-\\[9998\\] { z-index: 9998; }
    .sunny-widget .z-\\[9999\\] { z-index: 9999; }
    .sunny-widget .bottom-4 { bottom: 1rem; }
    .sunny-widget .bottom-20 { bottom: 5rem; }
    .sunny-widget .right-4 { right: 1rem; }
    .sunny-widget .left-4 { left: 1rem; }
    .sunny-widget .top-0 { top: 0; }
    .sunny-widget .right-0 { right: 0; }
    .sunny-widget .bottom-0 { bottom: 0; }
    .sunny-widget .w-2 { width: 0.5rem; }
    .sunny-widget .w-3 { width: 0.75rem; }
    .sunny-widget .w-4 { width: 1rem; }
    .sunny-widget .w-5 { width: 1.25rem; }
    .sunny-widget .w-6 { width: 1.5rem; }
    .sunny-widget .w-7 { width: 1.75rem; }
    .sunny-widget .w-8 { width: 2rem; }
    .sunny-widget .w-10 { width: 2.5rem; }
    .sunny-widget .w-12 { width: 3rem; }
    .sunny-widget .w-14 { width: 3.5rem; }
    .sunny-widget .h-2 { height: 0.5rem; }
    .sunny-widget .h-3 { height: 0.75rem; }
    .sunny-widget .h-4 { height: 1rem; }
    .sunny-widget .h-5 { height: 1.25rem; }
    .sunny-widget .h-6 { height: 1.5rem; }
    .sunny-widget .h-7 { height: 1.75rem; }
    .sunny-widget .h-8 { height: 2rem; }
    .sunny-widget .h-10 { height: 2.5rem; }
    .sunny-widget .h-12 { height: 3rem; }
    .sunny-widget .h-14 { height: 3.5rem; }
    .sunny-widget .w-\\[calc\\(100vw-2rem\\)\\] { width: calc(100vw - 2rem); }
    .sunny-widget .h-\\[550px\\] { height: 550px; }

    @media (min-width: 640px) {
      .sunny-widget .sm\\:w-16 { width: 4rem; }
      .sunny-widget .sm\\:h-16 { height: 4rem; }
      .sunny-widget .sm\\:w-\\[400px\\] { width: 400px; }
      .sunny-widget .sm\\:h-\\[600px\\] { height: 600px; }
      .sunny-widget .sm\\:bottom-6 { bottom: 1.5rem; }
      .sunny-widget .sm\\:right-6 { right: 1.5rem; }
      .sunny-widget .sm\\:left-6 { left: 1.5rem; }
      .sunny-widget .sm\\:bottom-24 { bottom: 6rem; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-25%); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

// Initialize the widget
const init = (config: SunnyConfig = {}) => {
  injectStyles();

  // Create container
  let container = document.getElementById('sunny-harper-widget');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sunny-harper-widget';
    container.className = 'sunny-widget';
    document.body.appendChild(container);
  }

  // Render
  const root = ReactDOM.createRoot(container);
  root.render(<SunnyChat {...config} />);
};

// Export for window object
(window as any).SunnyHarper = { init };

export { init };
