import { useState, useEffect, useContext } from 'react';
import GlobalContext from '../store/globalContext';
import classes from '../styles/projects.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function DevicesPage() {
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
      if (editName)  body.name        = editName;
      if (editToken) body.ubidotsToken = editToken;

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
    <div className={classes.container}>
      <h1>Devices</h1>

      <h2>Register Device</h2>
      <form onSubmit={registerDevice} className={classes.registerForm}>
        <label className={classes.formField}>
          Ubidots device label
          <input
            placeholder="e.g. seriallink"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            required
            className={classes.input}
          />
        </label>
        <label className={classes.formField}>
          Display name
          <input
            placeholder="Display name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            className={classes.input}
          />
        </label>
        <label className={classes.formField}>
          Ubidots API token
          <input
            type="password"
            placeholder="BBUS-..."
            value={newToken}
            onChange={e => setNewToken(e.target.value)}
            required
            className={classes.input}
          />
        </label>
        <button type="submit" className={classes.btn}>Register</button>
        {regError   && <p className={classes.error}>{regError}</p>}
        {regSuccess && <p className={classes.success}>{regSuccess}</p>}
      </form>

      <h2>Registered Devices</h2>
      {devices.length === 0 ? (
        <p>No devices registered yet.</p>
      ) : (
        <table className={classes.table}>
          <thead>
            <tr>
              <th className={classes.th}>Label</th>
              <th className={classes.th}>Name</th>
              <th className={classes.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <tr key={d.label}>
                <td className={classes.td}>{d.label}</td>
                <td className={classes.td}>
                  {editingLabel === d.label ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className={classes.input}
                    />
                  ) : d.name}
                </td>
                <td className={classes.td}>
                  {editingLabel === d.label ? (
                    <div className={classes.editActions}>
                      <input
                        type="password"
                        placeholder="New Ubidots token (leave blank to keep)"
                        value={editToken}
                        onChange={e => setEditToken(e.target.value)}
                        className={classes.editInput}
                      />
                      {editError && <span className={classes.error}>{editError}</span>}
                      <div className={classes.btnRow}>
                        <button onClick={() => saveEdit(d.label)} className={classes.btn}>Save</button>
                        <button onClick={cancelEdit} className={classes.cancelBtn}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className={classes.actionBtns}>
                      <button onClick={() => startEdit(d)}          className={classes.btn}>Edit</button>
                      <button onClick={() => deleteDevice(d.label)} className={classes.deleteBtn}>Delete</button>
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

export default DevicesPage;
