// src/components/KundaliMatch.js
import React, { useState } from 'react';
import { getMatchResult } from '../api';

const CITY_COORDS = {
  "Mumbai":    { lat: 19.076, lon: 72.877 },
  "Delhi":     { lat: 28.613, lon: 77.209 },
  "Bengaluru": { lat: 12.971, lon: 77.594 },
  "Chennai":   { lat: 13.082, lon: 80.270 },
  "Kolkata":   { lat: 22.572, lon: 88.363 },
  "Hyderabad": { lat: 17.385, lon: 78.487 },
  "Pune":      { lat: 18.520, lon: 73.856 },
  "London":    { lat: 51.508, lon: -0.128 },
  "New York":  { lat: 40.713, lon: -74.006 },
  "Dubai":     { lat: 25.205, lon: 55.271 },
};

const KOOTA_MAX = { Varna: 1, Vasya: 2, Tara: 3, Yoni: 4, GrahaMaitri: 5, Gana: 6, Bhakoot: 7, Nadi: 8 };

const getScoreColor = (score) => {
  if (score >= 28) return 'score-good';
  if (score >= 18) return 'score-ok';
  return 'score-low';
};

const getScoreLabel = (score) => {
  if (score >= 32) return 'Excellent Match ✦';
  if (score >= 24) return 'Good Match';
  if (score >= 18) return 'Acceptable';
  return 'Challenging';
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

const PersonForm = ({ title, data, onChange, prefix }) => (
  <div className="panel">
    <h2 className="panel-title">{title}</h2>
    <div className="form-grid">
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label>Full Name</label>
        <input value={data.name} onChange={e => onChange(prefix, 'name', e.target.value)} placeholder="Full name" />
      </div>
      <div className="form-group">
        <label>Date of Birth</label>
        <input type="date" value={data.dob} onChange={e => onChange(prefix, 'dob', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Time of Birth</label>
        <input type="time" value={data.tob} onChange={e => onChange(prefix, 'tob', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Birth City</label>
        <select value={data.city} onChange={e => onChange(prefix, 'city', e.target.value)}>
          {Object.keys(CITY_COORDS).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Latitude</label>
        <input value={data.lat} onChange={e => onChange(prefix, 'lat', e.target.value)} placeholder="e.g. 12.971" />
      </div>
      <div className="form-group">
        <label>Longitude</label>
        <input value={data.lon} onChange={e => onChange(prefix, 'lon', e.target.value)} placeholder="e.g. 77.594" />
      </div>
    </div>
  </div>
);

const KundaliMatch = () => {
  const [forms, setForms] = useState({
    p1: { name: '', dob: '', tob: '', city: 'Bengaluru', lat: '12.971', lon: '77.594' },
    p2: { name: '', dob: '', tob: '', city: 'Mumbai',    lat: '19.076', lon: '72.877' }
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (prefix, field, value) => {
    setForms(prev => {
      const next = { ...prev, [prefix]: { ...prev[prefix], [field]: value } };
      if (field === 'city' && CITY_COORDS[value]) {
        next[prefix].lat = CITY_COORDS[value].lat.toString();
        next[prefix].lon = CITY_COORDS[value].lon.toString();
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const toPayload = (p) => ({
        name: p.name, dob: p.dob, tob: p.tob,
        lat: parseFloat(p.lat), lon: parseFloat(p.lon)
      });
      const res = await getMatchResult({ person1: toPayload(forms.p1), person2: toPayload(forms.p2) });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = Object.values(forms.p1).every(Boolean) && Object.values(forms.p2).every(Boolean);

  return (
    <div>
      <PersonForm title="💑 Person 1 (Boy/Partner A)" data={forms.p1} onChange={handleChange} prefix="p1" />
      <PersonForm title="💑 Person 2 (Girl/Partner B)" data={forms.p2} onChange={handleChange} prefix="p2" />

      <button className="btn-primary" onClick={handleSubmit} disabled={!isValid || loading} style={{ marginBottom: '1.5rem' }}>
        {loading ? 'Calculating Compatibility...' : '✦ Match Kundali'}
      </button>

      {loading && (
        <div className="loading">
          <div className="loading-orbit" />
          <p>Calculating Guna Milan...</p>
        </div>
      )}

      {error && <div className="error">⚠ {error}</div>}

      {result && (
        <>
          {/* Moon Signs */}
          <div className="panel">
            <h2 className="panel-title">✦ Rashi Summary</h2>
            <div className="key-cards">
              <div className="key-card">
                <div className="key-card-label">{result.person1.name}</div>
                <div className="key-card-value">{result.person1.moonSign}</div>
                <div className="key-card-sub">{result.person1.nakshatra}</div>
              </div>
              <div className="key-card">
                <div className="key-card-label">{result.person2.name}</div>
                <div className="key-card-value">{result.person2.moonSign}</div>
                <div className="key-card-sub">{result.person2.nakshatra}</div>
              </div>
            </div>
          </div>

          {/* Guna Milan Score */}
          <div className="panel">
            <h2 className="panel-title">✦ Guna Milan Score</h2>
            <div className="score-container">
              <div className="score-ring">
                <span className="score-number">{result.gunaMilan.score}</span>
                <span className="score-denom">/36</span>
              </div>
              <div className={`score-label ${getScoreColor(result.gunaMilan.score)}`}>
                {getScoreLabel(result.gunaMilan.score)}
              </div>
            </div>

            {/* Koota Breakdown */}
            <h3 className="panel-title" style={{ marginTop: '1rem', fontSize: '0.75rem' }}>Ashta Koota Breakdown</h3>
            <div className="koota-grid">
              {Object.entries(result.gunaMilan.details).map(([koota, score]) => (
                <div className="koota-item" key={koota}>
                  <div className="koota-name">{koota}</div>
                  <div className="koota-score">{score} / {KOOTA_MAX[koota]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div className="panel">
            <h2 className="panel-title">✦ Compatibility Reading</h2>
            <div className="interpretation">
              {formatInterpretation(result.compatibility)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KundaliMatch;
