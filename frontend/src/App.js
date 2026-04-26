// src/App.js - Main astrology app
import React, { useState } from 'react';
import BirthChart from './components/BirthChart';
import KundaliMatch from './components/KundaliMatch';
import Horoscope from './components/Horoscope';
import './App.css';

const TABS = [
  { id: 'chart', label: '✦ Birth Chart', icon: '🪐' },
  { id: 'match', label: '✦ Kundali Match', icon: '💑' },
  { id: 'horoscope', label: '✦ Horoscope', icon: '🔮' }
];

function App() {
  const [activeTab, setActiveTab] = useState('chart');

  return (
    <div className="app">
      {/* Starfield background */}
      <div className="stars" aria-hidden="true">
        {[...Array(80)].map((_, i) => (
          <span key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            opacity: Math.random() * 0.7 + 0.3
          }} />
        ))}
      </div>

      {/* Header */}
      <header className="header">
        <div className="mandala" aria-hidden="true">☸</div>
        <h1 className="title">JYOTISH</h1>
        <p className="subtitle">Ancient Wisdom · Vedic Astrology · Cosmic Guidance</p>
        <div className="divider-ornament">✦ ✦ ✦</div>
      </header>

      {/* Tab Navigation */}
      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="content">
        {activeTab === 'chart' && <BirthChart />}
        {activeTab === 'match' && <KundaliMatch />}
        {activeTab === 'horoscope' && <Horoscope />}
      </main>

      <footer className="footer">
        <p>✦ Jyotish — The Science of Light ✦</p>
        <p className="footer-note">Positions calculated using Lahiri Ayanamsa (Sidereal/Vedic)</p>
      </footer>
    </div>
  );
}

export default App;
