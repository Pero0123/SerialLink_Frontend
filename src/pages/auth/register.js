import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../../store/globalContext';
import classes from '../../styles/auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function RegisterPage() {
  const [email,              setEmail]              = useState('');
  const [password,           setPassword]           = useState('');
  const [registrationSecret, setRegistrationSecret] = useState('');
  const [error,              setError]              = useState('');
  const router    = useRouter();
  const globalCtx = useContext(GlobalContext);

  useEffect(() => {
    if (globalCtx.isLoggedIn) {
      router.push('/');
    }
  }, [globalCtx.isLoggedIn, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, registrationSecret }),
      });
      const data = await response.json();
      if (response.ok) {
        globalCtx.login(data.token, email);
        router.push('/');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Network error. Check that the backend is running.');
    }
  };

  return (
    <div className={classes.container}>
      <h1>Register</h1>
      {error && <p className={classes.errorMsg}>{error}</p>}
      <form onSubmit={handleRegister}>
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
        <div className={classes.field}>
          <input
            type="password"
            placeholder="Registration secret"
            value={registrationSecret}
            onChange={e => setRegistrationSecret(e.target.value)}
            required
            className={classes.input}
          />
        </div>
        <button type="submit" className={classes.submitBtn}>Register</button>
      </form>
      <button onClick={() => router.push('/auth/login')} className={classes.secondaryBtn}>
        Back to Login
      </button>
    </div>
  );
}

export default RegisterPage;
