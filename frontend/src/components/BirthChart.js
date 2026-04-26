// src/components/BirthChart.js
import React, { useState } from 'react';
import { getBirthChart } from '../api';

// City coordinates lookup — common Indian cities
const CITY_COORDS = {
  "Mumbai":      { lat: 19.076, lon: 72.877 },
  "Delhi":       { lat: 28.613, lon: 77.209 },
  "Bengaluru":   { lat: 12.971, lon: 77.594 },
  "Chennai":     { lat: 13.082, lon: 80.270 },
  "Kolkata":     { lat: 22.572, lon: 88.363 },
  "Hyderabad":   { lat: 17.385, lon: 78.487 },
  "Pune":        { lat: 18.520, lon: 73.856 },
  "Ahmedabad":   { lat: 23.023, lon: 72.572 },
  "Jaipur":      { lat: 26.913, lon: 75.787 },
  "Lucknow":     { lat: 26.847, lon: 80.947 },
  "Chandigarh":  { lat: 30.733, lon: 76.779 },
  "Bhopal":      { lat: 23.259, lon: 77.413 },
  "Varanasi":    { lat: 25.317, lon: 82.973 },
  "London":      { lat: 51.508, lon: -0.128 },
  "New York":    { lat: 40.713, lon: -74.006 },
  "Dubai":       { lat: 25.205, lon: 55.271 },
};

const PLANET_SYMBOLS = {
  Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋'
};

// Format the Gemini markdown-ish text into React elements
const formatInterpretation = (text) => {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h3 key={i}>{line.replace(/\*\*/g, '')}</h3>;
    }
    if (line.match(/^\*\*.+\*\*/)) {
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    }
    if (line.startsWith('#')) {
      return <h3 key={i}>{line.replace(/#+\s?/, '')}</h3>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{line}</p>;
  });
};

const BirthChart = () => {
  const [form, setForm] = useState({
    name: '', dob: '', tob: '', city: 'Bengaluru',
    lat: '12.971', lon: '77.594'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // Auto-fill lat/lon when city is selected
      if (name === 'city' && CITY_COORDS[value]) {
        next.lat = CITY_COORDS[value].lat.toString();
        next.lon = CITY_COORDS[value].lon.toString();
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        dob: form.dob,
        tob: form.tob,
        lat: parseFloat(form.lat),
        lon: parseFloat(form.lon)
      };
      const res = await getBirthChart(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.name && form.dob && form.tob && form.lat && form.lon;

  return (
    <div>
      {/* Input Form */}
      <div className="panel">
        <h2 className="panel-title">🪐 Birth Chart & Predictions</h2>
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Arjun Sharma" />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" name="dob" value={form.dob} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Time of Birth</label>
            <input type="time" name="tob" value={form.tob} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Birth City</label>
            <select name="city" value={form.city} onChange={handleChange}>
              {Object.keys(CITY_COORDS).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
              <option value="custom">Custom coordinates</option>
            </select>
          </div>
          <div className="form-group">
            <label>Latitude</label>
            <input name="lat" value={form.lat} onChange={handleChange} placeholder="e.g. 12.971" />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input name="lon" value={form.lon} onChange={handleChange} placeholder="e.g. 77.594" />
          </div>
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? 'Consulting the Stars...' : '✦ Generate Birth Chart'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="loading-orbit" />
          <p>Calculating planetary positions...</p>
        </div>
      )}

      {/* Error */}
      {error && <div className="error">⚠ {error}</div>}

      {/* Results */}
      {result && (
        <>
          {/* Key Highlights */}
          <div className="panel">
            <h2 className="panel-title">✦ {result.name}'s Chart</h2>
            <div className="key-cards">
              <div className="key-card">
                <div className="key-card-label">Lagna (Ascendant)</div>
                <div className="key-card-value">{result.chart.ascendant.sign}</div>
                <div className="key-card-sub">{result.chart.ascendant.degrees}°</div>
              </div>
              <div className="key-card">
                <div className="key-card-label">Moon Sign (Rashi)</div>
                <div className="key-card-value">{result.chart.moon.sign}</div>
                <div className="key-card-sub">House {result.chart.moon.house}</div>
              </div>
              <div className="key-card">
                <div className="key-card-label">Nakshatra</div>
                <div className="key-card-value" style={{ fontSize: '1rem' }}>{result.chart.moon.nakshatra}</div>
              </div>
              <div className="key-card">
                <div className="key-card-label">Sun Sign</div>
                <div className="key-card-value">{result.chart.sun.sign}</div>
                <div className="key-card-sub">House {result.chart.sun.house}</div>
              </div>
            </div>

            {/* Planetary Positions */}
            <h3 className="panel-title" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Planetary Positions</h3>
            <div className="planet-grid">
              {Object.entries(result.chart.planets).map(([planet, data]) => (
                <div className="planet-card" key={planet}>
                  <div className="planet-name">{PLANET_SYMBOLS[planet] || '✦'} {planet}</div>
                  <div className="planet-sign">{data.sign}</div>
                  <div className="planet-house">House {data.house} · {data.degrees}°</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini Interpretation */}
          <div className="panel">
            <h2 className="panel-title">✦ Astrological Reading</h2>
            <div className="interpretation">
              {formatInterpretation(result.interpretation)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BirthChart;
