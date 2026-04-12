import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok) {
        // Backend returns a token on register — log the user in immediately
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
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Register</h1>
      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <button
          type="submit"
          style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgb(245, 173, 66)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Register
        </button>
      </form>
      <button
        onClick={() => router.push('/auth/login')}
        style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}
      >
        Back to Login
      </button>
    </div>
  );
}

export default RegisterPage;
