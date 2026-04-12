import { useState, useEffect, useContext } from 'react';
import GlobalContext from '../store/globalContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function ProjectsPage() {
  const globalCtx = useContext(GlobalContext);

  const [devices,      setDevices]      = useState([]);
  const [newLabel,     setNewLabel]     = useState('');
  const [newName,      setNewName]      = useState('');
  const [newToken,     setNewToken]     = useState('');
  const [regError,     setRegError]     = useState('');
  const [regSuccess,   setRegSuccess]   = useState('');
  const [editingLabel, setEditingLabel] = useState(null);
  const [editName,     setEditName]     = useState('');
  const [editToken,    setEditToken]    = useState('');
  const [editError,    setEditError]    = useState('');

  useEffect(() => {
    if (!globalCtx.token) return;
    fetchDevices();
  }, [globalCtx.token]);

  async function fetchDevices() {
    try {
      const res = await fetch(`${API_URL}/devices`, {
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setDevices(await res.json());
    } catch (e) {
      console.error('fetchDevices:', e.message);
    }
  }

  async function registerDevice(e) {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    try {
      const res = await fetch(`${API_URL}/devices`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...globalCtx.getAuthHeaders() },
        body:    JSON.stringify({ label: newLabel, name: newName, ubidotsToken: newToken }),
      });
      const data = await res.json();
      if (!res.ok) { setRegError(data.message || 'Registration failed'); return; }
      setRegSuccess(`Device "${data.name}" registered`);
      setNewLabel('');
      setNewName('');
      setNewToken('');
      fetchDevices();
    } catch {
      setRegError('Network error');
    }
  }

  function startEdit(device) {
    setEditingLabel(device.label);
    setEditName(device.name);
    setEditToken('');
    setEditError('');
  }

  function cancelEdit() {
    setEditingLabel(null);
    setEditError('');
  }

  async function saveEdit(label) {
    setEditError('');
    try {
      const body = {};
      if (editName)  body.name         = editName;
      if (editToken) body.ubidotsToken  = editToken;

      const res = await fetch(`${API_URL}/devices/${label}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...globalCtx.getAuthHeaders() },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.message || 'Update failed'); return; }
      setEditingLabel(null);
      fetchDevices();
    } catch {
      setEditError('Network error');
    }
  }

  async function deleteDevice(label) {
    if (!confirm(`Delete device "${label}" and all its readings?`)) return;
    try {
      const res = await fetch(`${API_URL}/devices/${label}`, {
        method:  'DELETE',
        headers: globalCtx.getAuthHeaders(),
      });
      if (!res.ok) { const d = await res.json(); alert(d.message); return; }
      fetchDevices();
    } catch {
      alert('Network error');
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Device Management</h1>

      {/* Register device */}
      <h2>Register Device</h2>
      <form onSubmit={registerDevice} style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '360px' }}>
        <label>
          <div style={{ marginBottom: '0.25rem' }}>Ubidots device label</div>
          <input
            placeholder="e.g. seriallink"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            required
            style={{ ...inputStyle, width: '100%' }}
          />
        </label>
        <label>
          <div style={{ marginBottom: '0.25rem' }}>Display name</div>
          <input
            placeholder="e.g. Unit 1 — Warehouse A"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            style={{ ...inputStyle, width: '100%' }}
          />
        </label>
        <label>
          <div style={{ marginBottom: '0.25rem' }}>Ubidots API token</div>
          <input
            type="password"
            placeholder="BBUS-..."
            value={newToken}
            onChange={e => setNewToken(e.target.value)}
            required
            style={{ ...inputStyle, width: '100%' }}
          />
        </label>
        <button type="submit" style={btnStyle}>Register</button>
        {regError   && <p style={{ color: 'red',   margin: 0 }}>{regError}</p>}
        {regSuccess && <p style={{ color: 'green', margin: 0 }}>{regSuccess}</p>}
      </form>

      {/* Device list */}
      <h2>Registered Devices</h2>
      {devices.length === 0 ? (
        <p>No devices registered yet.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Label</th>
              <th style={th}>Name</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <tr key={d.label}>
                <td style={td}>{d.label}</td>
                <td style={td}>
                  {editingLabel === d.label ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  ) : d.name}
                </td>
                <td style={td}>
                  {editingLabel === d.label ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input
                        type="password"
                        placeholder="New Ubidots token (leave blank to keep)"
                        value={editToken}
                        onChange={e => setEditToken(e.target.value)}
                        style={{ ...inputStyle, width: '260px' }}
                      />
                      {editError && <span style={{ color: 'red' }}>{editError}</span>}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => saveEdit(d.label)} style={btnStyle}>Save</button>
                        <button onClick={cancelEdit} style={{ ...btnStyle, backgroundColor: '#555' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => startEdit(d)}          style={btnStyle}>Edit</button>
                      <button onClick={() => deleteDevice(d.label)} style={{ ...btnStyle, backgroundColor: '#c0392b' }}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  padding: '0.5rem',
  border: '1px solid #555',
  borderRadius: '4px',
  backgroundColor: '#111',
  color: '#fff',
};

const btnStyle = {
  padding: '0.5rem',
  backgroundColor: 'rgb(245, 173, 66)',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default ProjectsPage;
