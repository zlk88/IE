'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseTimeInput, formatSeconds } from '@/lib/utils';

export default function AddProcess() {
  const router = useRouter();
  const [form, setForm] = useState({
    process_name: '', style: '', specification: '', description: '',
    work_seconds: '', is_tested: false,
  });
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.replace('/login');
        } else {
          setChecking(false);
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    const sec = parseTimeInput(form.work_seconds);
    setPreview(sec > 0 ? `${formatSeconds(sec)} (${sec}秒)` : '');
  }, [form.work_seconds]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const work_seconds = parseTimeInput(form.work_seconds);
    if (!form.process_name || !form.style || work_seconds <= 0) {
      setError('请填写所有必填字段，且工时必须大于0秒');
      return;
    }
    const res = await fetch('/api/processes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, work_seconds }),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('登录已过期，请重新登录');
      router.replace('/login');
      return;
    }
    if (!res.ok) { setError(data.error || '添加失败'); return; }
    router.push('/');
  }

  if (checking) return <div className="container"><div className="card">验证权限中...</div></div>;

  return (
    <div className="container" style={{ maxWidth: 600, margin: '40px auto' }}>
      <div className="card">
        <h1 style={{ textAlign: 'center', marginBottom: 30 }}>添加新工艺</h1>
        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 15, borderRadius: 8, marginBottom: 20 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>工艺名称 *</label>
            <input className="form-control" value={form.process_name} onChange={(e) => update('process_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>款式 *</label>
            <input className="form-control" value={form.style} onChange={(e) => update('style', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>规格</label>
            <input className="form-control" value={form.specification} onChange={(e) => update('specification', e.target.value)} />
          </div>
          <div className="form-group">
            <label>说明</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label>工时 * （支持 3600 或 1:00:00 或 30:00）</label>
            <input className="form-control" value={form.work_seconds} onChange={(e) => update('work_seconds', e.target.value)} placeholder="例如：3600 或 1:00:00 或 30:00" required />
            {preview && <div style={{ background: '#e3f2fd', padding: 10, borderRadius: 6, marginTop: 10 }}>时间预览：<strong style={{ color: '#1976D2' }}>{preview}</strong></div>}
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.is_tested} onChange={(e) => update('is_tested', e.target.checked)} />
              <span>已测试过工时</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 30 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 12 }}>添加工艺</button>
            <Link href="/" className="btn btn-secondary" style={{ flex: 1, padding: 12, justifyContent: 'center' }}>返回首页</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
