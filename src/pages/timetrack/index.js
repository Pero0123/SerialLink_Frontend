import { useState, useEffect, useContext } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import GlobalContext from '../../store/globalContext';
import classes from '../../styles/timetrack.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// One fixed color per sensor variable, taken from the app's pie-chart palette
const SENSOR_COLORS = {
  return_z1:     '#1E3D6E', // dark navy
  return_z2:     '#29B6F6', // sky blue
  return_z3:     '#E91E8C', // hot pink
  discharge_z1:  '#CC3333', // red
  coolant_water: '#00897B', // teal
  evap_coil:     '#7B1FA2', // purple
  ambient:       '#F5A623', // amber
};
// Fallback palette for any unexpected variable names
const FALLBACK_COLORS = ['#43A047', '#FF7043', '#26C6DA', '#FDD835', '#8D6E63'];
function sensorColor(variable, index) {
  return SENSOR_COLORS[variable] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Recharts prop objects — must stay inline (Recharts API)
const chartGrid   = { horizontal: true, vertical: true, strokeDasharray: '3 3', stroke: '#9DA6AF' };
const axisStyle   = { stroke: '#5A6269', tick: { fill: '#393E43', fontSize: 14 }, minTickGap: 60 };
const tooltipStyle = { backgroundColor: '#9DA6AF', border: '1px solid #7B858E', color: '#1B1D20' };
const legendStyle  = { color: '#1B1D20' };

function TimeTrackPage() {
  const globalCtx = useContext(GlobalContext);

  const [devices,        setDevices]        = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [latest,         setLatest]         = useState(null);
  const [variables,      setVariables]      = useState([]);
  const [selectedVars,   setSelectedVars]   = useState([]);
  const [fromDate,       setFromDate]       = useState('');
  const [toDate,         setToDate]         = useState('');
  const [chartData,      setChartData]      = useState([]);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);

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
      setSelectedVars(vars);
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
      if (fromDate) url += `&from=${new Date(fromDate + 'T00:00:00').toISOString()}`;
      if (toDate)   url += `&to=${new Date(toDate   + 'T23:59:59').toISOString()}`;

      const res = await fetch(url, { headers: globalCtx.getAuthHeaders() });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const raw = await res.json();

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
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div className={classes.container}>
      <h1>Readings</h1>

      {error && <p className={classes.error}>{error}</p>}

      {/* Device selector */}
      <div className={classes.deviceSelector}>
        <label>
          Device:
          <select
            className={classes.deviceSelect}
            value={selectedDevice}
            onChange={e => setSelectedDevice(e.target.value)}
          >
            {devices.length === 0 && <option value="">No devices registered</option>}
            {devices.map(d => (
              <option key={d.label} value={d.label}>{d.name} ({d.label})</option>
            ))}
          </select>
        </label>
      </div>

      {/* Latest readings */}
      <h2>Latest</h2>
      {latest && Object.keys(latest).length > 0 ? (
        <div className={classes.tableWrapper}>
        <table className={classes.table}>
          <thead>
            <tr>
              <th className={classes.th}>Variable</th>
              <th className={classes.th}>Value</th>
              <th className={classes.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(latest).map(([variable, { value, timestamp }]) => (
              <tr key={variable}>
                <td className={classes.td}>{variable}</td>
                <td className={classes.td}>{value}</td>
                <td className={classes.td}>{new Date(timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : (
        <p>No data</p>
      )}

      {/* Chart */}
      <h2>Chart</h2>

      {/* Variable checkboxes */}
      {variables.length > 0 && (
        <div className={classes.varList}>
          {variables.map((v, i) => (
            <label key={v} className={classes.varLabel}>
              <input
                type="checkbox"
                checked={selectedVars.includes(v)}
                onChange={() => toggleVar(v)}
              />
              {/* color is dynamic per variable — must stay inline */}
              <span style={{ color: sensorColor(v, i) }}>{v}</span>
            </label>
          ))}
        </div>
      )}

      {/* Date range */}
      <div className={classes.dateRange}>
        <label className={classes.dateField}>
          From
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className={classes.input}
          />
        </label>
        <label className={classes.dateField}>
          To
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className={classes.input}
          />
        </label>
        <button
          onClick={fetchChartData}
          className={classes.fetchBtn}
          disabled={loading || !selectedDevice}
        >
          {loading ? 'Loading…' : 'Fetch'}
        </button>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(''); setToDate(''); }}
            className={classes.clearBtn}
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Chart output */}
      {chartData.length > 0 ? (
        <div className={classes.chartWrapper}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid {...chartGrid} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatTick}
              {...axisStyle}
            />
            <YAxis width={45} {...axisStyle} />
            <Tooltip
              labelFormatter={ts => new Date(ts).toLocaleString()}
              contentStyle={tooltipStyle}
            />
            <Legend wrapperStyle={legendStyle} />
            {selectedVars.map((v, i) => (
              <Line
                key={v}
                type="monotone"
                dataKey={v}
                stroke={sensorColor(v, i)}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
      ) : (
        !loading && <p className={classes.chartHint}>Select sensors and a date range, then click Fetch.</p>
      )}
    </div>
  );
}

export default TimeTrackPage;
