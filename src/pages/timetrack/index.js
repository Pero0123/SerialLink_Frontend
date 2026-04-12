import { useState, useEffect, useContext } from 'react';
import GlobalContext from '../store/globalContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function TimeTrackPage() {
  const globalCtx = useContext(GlobalContext);

  const [latest, setLatest] = useState(null);
  const [readings, setReadings] = useState([]);
  const [variables, setVariables] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!globalCtx.token) return;
    fetchLatest();
    fetchVariables();
    fetchReadings();
  }, [globalCtx.token]);

  async function fetchLatest() {
    try {
      const res = await fetch(`${API_URL}/readings/latest`, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setLatest(await res.json());
    } catch (e) {
      setError(`Latest: ${e.message}`);
    }
  }

  async function fetchVariables() {
    try {
      const res = await fetch(`${API_URL}/readings/variables`, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setVariables(await res.json());
    } catch (e) {
      setError(`Variables: ${e.message}`);
    }
  }

  async function fetchReadings(variable) {
    setLoading(true);
    try {
      const url = variable
        ? `${API_URL}/readings?variable=${variable}&limit=50`
        : `${API_URL}/readings?limit=50`;
      const res = await fetch(url, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setReadings([...data].reverse()); // newest first
    } catch (e) {
      setError(`Readings: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleVariableChange(e) {
    const val = e.target.value;
    setSelectedVariable(val);
    fetchReadings(val);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Sensor Readings</h1>

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      {/* Latest readings */}
      <h2>Latest</h2>
      {latest ? (
        <table style={{ borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={th}>Variable</th>
              <th style={th}>Value (°C)</th>
              <th style={th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(latest).map(([variable, { value, timestamp }]) => (
              <tr key={variable}>
                <td style={td}>{variable}</td>
                <td style={td}>{value}</td>
                <td style={td}>{new Date(timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No data</p>
      )}

      {/* Filter + readings list */}
      <h2>Readings (last 50)</h2>
      <div style={{ marginBottom: '1rem' }}>
        <select value={selectedVariable} onChange={handleVariableChange}>
          <option value="">All variables</option>
          {variables.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <button onClick={() => fetchReadings(selectedVariable)} style={{ marginLeft: '0.5rem' }}>
          Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && readings.length > 0 && (
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Variable</th>
              <th style={th}>Value (°C)</th>
              <th style={th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.variable}</td>
                <td style={td}>{r.value}</td>
                <td style={td}>{new Date(r.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && readings.length === 0 && <p>No readings</p>}
    </div>
  );
}

const th = {
  border: '1px solid #555',
  padding: '0.4rem 0.8rem',
  textAlign: 'left',
  backgroundColor: '#222',
  color: '#fff',
};

const td = {
  border: '1px solid #555',
  padding: '0.4rem 0.8rem',
};

export default TimeTrackPage;
