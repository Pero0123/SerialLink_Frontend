import { useState, useEffect, useContext } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import GlobalContext from '../../store/globalContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const COLORS = ['#f5ad42', '#4af', '#f55', '#4f4', '#a4f', '#fa4', '#4ff'];

function TimeTrackPage() {
  const globalCtx = useContext(GlobalContext);

  const [devices,          setDevices]          = useState([]);
  const [selectedDevice,   setSelectedDevice]   = useState('');
  const [latest,           setLatest]           = useState(null);
  const [variables,        setVariables]        = useState([]);
  const [selectedVars,     setSelectedVars]     = useState([]);
  const [fromDate,         setFromDate]         = useState('');
  const [toDate,           setToDate]           = useState('');
  const [chartData,        setChartData]        = useState([]);
  const [error,            setError]            = useState('');
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    if (!globalCtx.token) return;
    fetchDevices();
  }, [globalCtx.token]);

  useEffect(() => {
    if (!selectedDevice) return;
    setSelectedVars([]);
    setLatest(null);
    setChartData([]);
    fetchLatest(selectedDevice);
    fetchVariables(selectedDevice);
  }, [selectedDevice]);

  async function fetchDevices() {
    try {
      const res = await fetch(`${API_URL}/devices`, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setDevices(data);
      if (data.length > 0) setSelectedDevice(data[0].label);
    } catch (e) {
      setError(`Devices: ${e.message}`);
    }
  }

  async function fetchLatest(device) {
    try {
      const res = await fetch(`${API_URL}/readings/latest?device=${device}`, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setLatest(await res.json());
    } catch (e) {
      setError(`Latest: ${e.message}`);
    }
  }

  async function fetchVariables(device) {
    try {
      const res = await fetch(`${API_URL}/readings/variables?device=${device}`, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const vars = await res.json();
      setVariables(vars);
      setSelectedVars(vars); // default: all selected
    } catch (e) {
      setError(`Variables: ${e.message}`);
    }
  }

  async function fetchChartData() {
    if (!selectedDevice || selectedVars.length === 0) return;
    setLoading(true);
    setError('');
    try {
      let url = `${API_URL}/readings?device=${selectedDevice}&limit=5000`;
      if (fromDate) url += `&from=${new Date(fromDate).toISOString()}`;
      if (toDate)   url += `&to=${new Date(toDate).toISOString()}`;

      const res = await fetch(url, { headers: globalCtx.getAuthHeaders() });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const raw = await res.json(); // [{variable, value, timestamp}], oldest→newest

      // Pivot: group by timestamp, one row per timestamp with a key per variable
      const byTime = {};
      for (const r of raw) {
        if (!selectedVars.includes(r.variable)) continue;
        const t = new Date(r.timestamp).getTime();
        if (!byTime[t]) byTime[t] = { timestamp: t };
        byTime[t][r.variable] = r.value;
      }

      const rows = Object.values(byTime).sort((a, b) => a.timestamp - b.timestamp);
      setChartData(rows);
    } catch (e) {
      setError(`Chart: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function toggleVar(v) {
    setSelectedVars(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  }

  function formatTick(ts) {
    const d = new Date(ts);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Readings</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Device selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginRight: '0.5rem' }}>Device:</label>
        <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
          {devices.length === 0 && <option value="">No devices registered</option>}
          {devices.map(d => (
            <option key={d.label} value={d.label}>{d.name} ({d.label})</option>
          ))}
        </select>
      </div>

      {/* Latest readings */}
      <h2>Latest</h2>
      {latest && Object.keys(latest).length > 0 ? (
        <table style={{ borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={th}>Variable</th>
              <th style={th}>Value</th>
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

      {/* Chart section */}
      <h2>Chart</h2>

      {/* Sensor checkboxes */}
      {variables.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {variables.map((v, i) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedVars.includes(v)}
                onChange={() => toggleVar(v)}
              />
              <span style={{ color: COLORS[i % COLORS.length] }}>{v}</span>
            </label>
          ))}
        </div>
      )}

      {/* Date range */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
          From
          <input
            type="datetime-local"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
          To
          <input
            type="datetime-local"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={inputStyle}
          />
        </label>
        <button
          onClick={fetchChartData}
          style={{ ...btnStyle, alignSelf: 'flex-end' }}
          disabled={loading || !selectedDevice}
        >
          {loading ? 'Loading…' : 'Fetch'}
        </button>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); }}
            style={{ ...btnStyle, backgroundColor: '#555', alignSelf: 'flex-end' }}
          >
            Clear dates
          </button>
        )}
      </div>

      {chartData.length > 0 ? (
        <div style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTick}
              stroke="#aaa"
              tick={{ fill: '#aaa', fontSize: 11 }}
            />
            <YAxis width={45} stroke="#aaa" tick={{ fill: '#aaa', fontSize: 11 }} />
            <Tooltip
              labelFormatter={ts => new Date(ts).toLocaleString()}
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #555', color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#ccc' }} />
            {selectedVars.map((v, i) => (
              <Line
                key={v}
                type="monotone"
                dataKey={v}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
      ) : (
        !loading && <p style={{ color: '#888' }}>Select sensors and a date range, then click Fetch.</p>
      )}
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

const inputStyle = {
  padding: '0.4rem',
  border: '1px solid #555',
  borderRadius: '4px',
  backgroundColor: '#111',
  color: '#fff',
};

const btnStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'rgb(245, 173, 66)',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default TimeTrackPage;
