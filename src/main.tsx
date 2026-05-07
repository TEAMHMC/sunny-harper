import React from 'react';
import ReactDOM from 'react-dom/client';
import { SunnyChat } from './SunnyChat';

// Development mode - renders Sunny on a test page
const App = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Sunny Harper Chat Widget - Development
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Click the chat button in the bottom right to test Sunny Harper.
        </p>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            How to Embed on Your Website
          </h2>
          <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '14px' }}>
{`<!-- Add before </body> -->
<script src="https://your-domain.com/sunny-harper.iife.js"></script>
<script>
  SunnyHarper.init({
    lang: 'en',           // 'en' or 'es'
    position: 'bottom-right',  // or 'bottom-left'
    primaryColor: '#233dff',   // Your brand color
  });
</script>`}
          </pre>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Test Conversations
          </h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Try asking Sunny about:
          </p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Mental health support</li>
            <li>Food assistance</li>
            <li>Housing help</li>
            <li>Healthcare access</li>
            <li>Legal aid</li>
            <li>Employment & job training</li>
            <li>Reentry / justice-involved services</li>
            <li>Domestic violence resources</li>
            <li>Veterans services</li>
            <li>LGBTQ+ resources</li>
            <li>Senior services</li>
            <li>Youth & family services</li>
            <li>"I want to talk to a real person"</li>
          </ul>
        </div>
      </div>

      {/* Sunny Chat Widget */}
      <SunnyChat lang="en" />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
