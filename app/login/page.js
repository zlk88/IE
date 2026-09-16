'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || '登录失败');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 420, margin: '80px auto' }}>
      <div className="card">
        <h1 style={{ textAlign: 'center', marginBottom: 10 }}>管理员登录</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 30, fontSize: 14 }}>
          登录后可管理工艺数据
        </p>
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>管理员密码</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: 12, fontSize: 16 }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ color: '#2196F3', fontSize: 14 }}>
            ← 返回首页（免登录查看分析）
          </Link>
        </div>
      </div>
    </div>
  );
}
