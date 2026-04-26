// src/components/Horoscope.js
import React, { useState } from 'react';
import { getHoroscope } from '../api';

const MOON_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

const formatInterpretation = (text) => {
  return text.split('\n').map((line, i) => {
    if (line.match(/^\*\*.+\*\*/)) {
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    }
    if (line.startsWith('#')) return <h3 key={i}>{line.replace(/#+\s?/, '')}</h3>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{line}</p>;
  });
};

const Horoscope = () => {
  const [moonSign, setMoonSign] = useState('Aries');
  const [period, setPeriod] = useState('daily');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await getHoroscope({ moonSign, period });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="panel">
        <h2 className="panel-title">🔮 Horoscope</h2>

        {/* Period Toggle */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label>Period</label>
          </p>
          <div className="period-toggle">
            <button className={`period-btn ${period === 'daily' ? 'active' : ''}`} onClick={() => setPeriod('daily')}>Daily</button>
            <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
          </div>
        </div>

        {/* Moon Sign Grid */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Your Moon Sign (Rashi)</label>
          <div className="planet-grid" style={{ marginTop: '0.5rem' }}>
            {MOON_SIGNS.map(sign => (
              <button
                key={sign}
                onClick={() => setMoonSign(sign)}
                className="planet-card"
                style={{
                  cursor: 'pointer',
                  border: moonSign === sign ? '1px solid var(--gold)' : '1px solid var(--panel-border)',
                  background: moonSign === sign ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                  color: moonSign === sign ? 'var(--gold)' : 'var(--text)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{SIGN_SYMBOLS[sign]}</div>
                <div className="planet-sign" style={{ fontSize: '0.9rem' }}>{sign}</div>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Reading the Stars...' : `✦ Get ${period === 'daily' ? 'Daily' : 'Monthly'} Horoscope`}
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-orbit" />
          <p>Consulting planetary movements...</p>
        </div>
      )}

      {error && <div className="error">⚠ {error}</div>}

      {result && (
        <div className="panel">
          <h2 className="panel-title">
            {SIGN_SYMBOLS[result.moonSign]} {result.moonSign} — {result.period === 'daily' ? 'Daily' : 'Monthly'} Horoscope
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1.2rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
            {new Date(result.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="interpretation">
            {formatInterpretation(result.horoscope)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Horoscope;
