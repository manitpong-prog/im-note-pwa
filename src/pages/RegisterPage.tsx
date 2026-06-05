import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setErrorText('');
    setSuccessText('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorText(error.message);
      return;
    }

    setSuccessText('สมัครสำเร็จแล้ว กรุณาเช็คอีเมล หรือกลับไปเข้าสู่ระบบ');
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 16 }}>
      <h1>สมัครใช้งาน iM Note</h1>

      <form onSubmit={handleRegister}>
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
            minLength={6}
          />
        </label>

        {errorText && <p style={{ color: 'red' }}>{errorText}</p>}
        {successText && <p style={{ color: 'green' }}>{successText}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'กำลังสมัคร...' : 'สมัครใช้งาน'}
        </button>
      </form>

      <p>
        มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
      </p>
    </main>
  );
}