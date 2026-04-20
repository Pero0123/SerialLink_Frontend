import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../../store/globalContext';
import classes from '../../styles/auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const router    = useRouter();
  const globalCtx = useContext(GlobalContext);

  useEffect(() => {
    if (globalCtx.isLoggedIn) {
      router.push('/');
    }
  }, [globalCtx.isLoggedIn, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        globalCtx.login(data.token, email);
        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Check that the backend is running.');
    }
  };

  return (
    <div className={classes.container}>
      <h1>Login</h1>
      {error && <p className={classes.errorMsg}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div className={classes.field}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={classes.input}
          />
        </div>
        <div className={classes.field}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={classes.input}
          />
        </div>
        <button type="submit" className={classes.submitBtn}>Login</button>
      </form>
      <button
        className={classes.secondaryBtn}
        onClick={() => {
          setEmail('testuser@gmail.com');
          setPassword('Password');
          fetch(`${API_URL}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email: 'testuser@gmail.com', password: 'Password' }),
          })
            .then(r => r.json().then(data => ({ ok: r.ok, data })))
            .then(({ ok, data }) => {
              if (ok) {
                globalCtx.login(data.token, 'testuser@gmail.com');
                router.push('/');
              } else {
                setError(data.message || 'Login failed');
              }
            })
            .catch(() => setError('Network error. Check that the backend is running.'));
        }}
      >
        Login as Test User
      </button>
      <button onClick={() => router.push('/auth/register')} className={classes.secondaryBtn}>
        Register
      </button>
    </div>
  );
}

export default LoginPage;
