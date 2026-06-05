import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setErrorText('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorText(error.message);
      return;
    }

    navigate('/notes', { replace: true });
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 16 }}>
      <h1>เข้าสู่ระบบ iM Note</h1>

      <form onSubmit={handleLogin}>
        <label>
          Email
          <input
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorText && <p style={{ color: 'red' }}>{errorText}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p>
        ยังไม่มีบัญชี? <Link to="/register">สมัครใช้งาน</Link>
      </p>
    </main>
  );
}