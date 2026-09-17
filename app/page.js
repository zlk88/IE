'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DAILY_SECONDS, HOURLY_RATE, formatSeconds, secondsToHours,
  calculateDailyOutput, calculateLaborCost,
} from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedStyles, setExpandedStyles] = useState({});
  const [expandedAnalysisStyles, setExpandedAnalysisStyles] = useState({});
  const [selected, setSelected] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchProcesses();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAdmin(!!data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
    setAuthChecked(true);
  }

  async function fetchProcesses() {
    setLoading(true);
    const res = await fetch('/api/processes');
    const data = await res.json();
    setProcesses(data);
    if (data.length > 0) {
      const firstStyle = data[0].style;
      setExpandedStyles({ [firstStyle]: true });
      setExpandedAnalysisStyles({ [firstStyle]: true });
    }
    setLoading(false);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  }

  const styleGroups = useMemo(() => {
    const groups = {};
    processes.forEach((p) => {
      if (!groups[p.style]) groups[p.style] = [];
      groups[p.style].push(p);
    });
    return groups;
  }, [processes]);

  const testedCount = processes.filter((p) => p.is_tested).length;

  const selectionSummary = useMemo(() => {
    let totalSeconds = 0;
    let totalItems = 0;
    let count = 0;
    Object.entries(selected).forEach(([id, s]) => {
      if (s.checked) {
        const p = processes.find((x) => x.id === Number(id));
        if (p) {
          totalSeconds += p.work_seconds * s.count;
          totalItems += s.count;
          count++;
        }
      }
    });
    const dailyOutput = totalSeconds > 0 ? Math.floor(DAILY_SECONDS / totalSeconds) : 0;
    return { totalSeconds, totalItems, count, dailyOutput };
  }, [selected, processes]);

  function toggleStyle(style) {
    setExpandedStyles((prev) => ({ ...prev, [style]: !prev[style] }));
  }
  function toggleAnalysisStyle(style) {
    setExpandedAnalysisStyles((prev) => ({ ...prev, [style]: !prev[style] }));
  }
  function toggleAllStyles(expand) {
    const next = {};
    Object.keys(styleGroups).forEach((s) => (next[s] = expand));
    setExpandedStyles(next);
  }
  function toggleAllAnalysisStyles(expand) {
    const next = {};
    Object.keys(styleGroups).forEach((s) => (next[s] = expand));
    setExpandedAnalysisStyles(next);
  }
  function toggleCheckbox(id) {
    setSelected((prev) => {
      const cur = prev[id] || { checked: false, count: 1 };
      return { ...prev, [id]: { ...cur, checked: !cur.checked } };
    });
  }
  function setCount(id, count) {
    count = Math.max(1, parseInt(count, 10) || 1);
    setSelected((prev) => {
      const cur = prev[id] || { checked: false, count: 1 };
      return { ...prev, [id]: { ...cur, count } };
    });
  }
  function selectAll(checked) {
    const next = { ...selected };
    processes.forEach((p) => {
      next[p.id] = { checked, count: next[p.id]?.count || 1 };
    });
    setSelected(next);
  }
  function setAllCounts(count) {
    const next = {};
    processes.forEach((p) => {
      next[p.id] = { checked: selected[p.id]?.checked || false, count };
    });
    setSelected(next);
  }

  function handleAnalyze() {
    const chosen = processes.filter((p) => selected[p.id]?.checked);
    if (chosen.length === 0) { alert('请至少选择一个工艺进行分析！'); return; }
    const resultProcesses = chosen.map((p) => ({ ...p, selected_count: selected[p.id].count }));
    let totalSeconds = 0, totalItems = 0;
    resultProcesses.forEach((p) => {
      totalSeconds += p.work_seconds * p.selected_count;
      totalItems += p.selected_count;
    });
    const totalHours = secondsToHours(totalSeconds);
    const dailyOutput = calculateDailyOutput(totalSeconds);
    const laborCost = calculateLaborCost(totalSeconds);
    setAnalysisResult({
      processes: resultProcesses, totalSeconds, totalHours, totalItems, dailyOutput, laborCost,
      dailyLaborCost: Math.round(laborCost * dailyOutput * 100) / 100,
    });
  }

  async function handleDelete(id, name) {
    if (!confirm(`确定要删除【${name}】这个工艺吗？`)) return;
    const res = await fetch(`/api/processes/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      alert('登录已过期，请重新登录');
      setIsAdmin(false);
      return;
    }
    fetchProcesses();
  }

  if (!authChecked || loading) {
    return <div className="container"><div className="card">加载中...</div></div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>IE工时管理系统</h1>
        <p className="subtitle">
          {isAdmin ? '工艺工时管理与生产分析系统（管理员模式）' : '工艺工时分析系统'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 15 }}>
          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="btn"
              style={{ background: '#6c757d', color: 'white', padding: '8px 20px' }}
            >
              🚪 退出登录
            </button>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ padding: '8px 20px' }}
            >
              🔐 管理员登录
            </Link>
          )}
        </div>

        <div className="system-info">
          <div className="info-item"><div className="info-label">每日工作时间</div><div className="info-value">{formatSeconds(DAILY_SECONDS)}</div></div>
          <div className="info-item"><div className="info-label">时薪标准</div><div className="info-value">{HOURLY_RATE} 元/小时</div></div>
          <div className="info-item"><div className="info-label">工艺总数</div><div className="info-value">{processes.length} 个</div></div>
          {isAdmin && (
            <div className="info-item"><div className="info-label">已测试工艺</div><div className="info-value">{testedCount} 个</div></div>
          )}
        </div>
      </div>

      <div
        className="main-content"
        style={{ gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr' }}
      >
        {isAdmin && (
          <div className="card">
            <h2>工艺列表（按款式分组）</h2>
            <div className="analysis-controls">
              <button className="list-control-btn" onClick={() => toggleAllStyles(true)}>📖 展开所有款式</button>
              <button className="list-control-btn" onClick={() => toggleAllStyles(false)}>📕 折叠所有款式</button>
            </div>
            <div className="process-list">
              {Object.entries(styleGroups).map(([style, list]) => (
                <div className="style-group" key={style}>
                  <div className="style-header" onClick={() => toggleStyle(style)}>
                    <div className="style-title">{style}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <span className="style-count">{list.length} 个工艺</span>
                      <span>{expandedStyles[style] ? '▼' : '▶'}</span>
                    </div>
                  </div>
                  <div className={`style-processes ${expandedStyles[style] ? 'expanded' : ''}`}>
                    {list.map((p) => (
                      <div className="process-item" key={p.id}>
                        <div className="process-header">
                          <div>
                            <div className="process-name">{p.process_name} <span className="process-id">#{p.id}</span></div>
                            <div style={{ marginTop: 5 }}>
                              <span className="style-count" style={{ marginRight: 5 }}>{p.style}</span>
                              {p.is_tested ? <span className="tested-badge">已测试</span> : <span className="untested-badge">未测试</span>}
                            </div>
                          </div>
                          <div className="process-time">
                            <span className="process-seconds">{p.work_seconds} 秒</span>
                            <span className="process-formatted">{formatSeconds(p.work_seconds)}</span>
                          </div>
                        </div>
                        {p.specification && <div className="process-spec">📏 规格: {p.specification}</div>}
                        {p.description && <div className="process-description">📝 {p.description}</div>}
                        <div className="actions">
                          <Link href={`/edit/${p.id}`} className="btn btn-secondary">✏️ 编辑</Link>
                          <Link href={`/detail/${p.id}`} className="btn btn-primary">👁️ 详情</Link>
                          <button className="btn btn-danger" onClick={() => handleDelete(p.id, p.process_name)}>🗑️ 删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link href="/add" className="btn btn-primary" style={{ padding: '10px 30px', fontSize: 16 }}>➕ 添加新工艺</Link>
            </div>
          </div>
        )}

        <div className="card">
          <h2>多工艺分析 <span style={{ fontSize: 14, color: '#ff9800' }}>支持设置工艺次数</span></h2>
          <div className="analysis-controls">
            <button className="list-control-btn" onClick={() => selectAll(true)}>✅ 全选</button>
            <button className="list-control-btn" onClick={() => selectAll(false)}>❌ 取消全选</button>
            <button className="list-control-btn" onClick={() => setAllCounts(1)}>1️⃣ 全部设为1次</button>
            <button className="list-control-btn" onClick={() => toggleAllAnalysisStyles(true)}>📖 展开所有</button>
            <button className="list-control-btn" onClick={() => toggleAllAnalysisStyles(false)}>📕 折叠所有</button>
          </div>
          <div>
            {Object.entries(styleGroups).map(([style, list]) => (
              <div className="analysis-style-group" key={style}>
                <div className="analysis-style-header" onClick={() => toggleAnalysisStyle(style)}>
                  <div className="analysis-style-title">{style}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <span className="style-count">{list.length} 个工艺</span>
                    <span>{expandedAnalysisStyles[style] ? '▼' : '▶'}</span>
                  </div>
                </div>
                <div className={`analysis-processes ${expandedAnalysisStyles[style] ? 'expanded' : ''}`}>
                  {list.map((p) => {
                    const s = selected[p.id] || { checked: false, count: 1 };
                    return (
                      <div className={`analysis-checkbox-item ${s.checked ? 'checked' : ''}`} key={p.id}>
                        <input type="checkbox" checked={s.checked} onChange={() => toggleCheckbox(p.id)} />
                        <div className="analysis-checkbox-info">
                          <div className="analysis-process-name">
                            {p.process_name}
                            {p.is_tested ? <span className="tested-badge" style={{ marginLeft: 5 }}>已测试</span> : <span className="untested-badge" style={{ marginLeft: 5 }}>未测试</span>}
                          </div>
                          <div className="analysis-process-time">{formatSeconds(p.work_seconds)} ({p.work_seconds}秒)</div>
                          <div className="analysis-count-control">
                            <span>🔄 次数:</span>
                            <input type="number" className="analysis-count-input" value={s.count} min="1" max="100" onChange={(e) => setCount(p.id, e.target.value)} />
                            <span>次</span>
                            {[1, 2, 3].map((n) => (
                              <button key={n} type="button" className="quick-count-btn" onClick={() => setCount(p.id, n)}>{n}</button>
                            ))}
                            <span className="analysis-subtotal">{formatSeconds(p.work_seconds * s.count)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="summary-bar">
            <div>📋 已选择 <span className="highlight">{selectionSummary.count}</span> 个工艺<span style={{ margin: '0 10px' }}>|</span>📦 总工序次数: <span className="highlight-orange">{selectionSummary.totalItems}</span> 次</div>
            <div>⏱️ 总工时: <span className="highlight-blue">{selectionSummary.totalSeconds.toLocaleString()}</span> 秒<span style={{ margin: '0 10px' }}>|</span>📊 预估日产量: <span className="highlight-orange">{selectionSummary.dailyOutput}</span> 件/天</div>
          </div>
          <button className="btn btn-warning" style={{ width: '100%', padding: 12, fontSize: 16, marginTop: 15 }} onClick={handleAnalyze}>🔍 开始分析（考虑工艺次数）</button>
          {analysisResult && (
            <div className="analysis-result">
              <h3>分析结果 <span className="untested-badge" style={{ background: '#ff9800' }}>总工序次数: {analysisResult.totalItems} 次</span></h3>
              <p style={{ marginTop: 10 }}><strong>已选择工艺：</strong><span style={{ color: '#4CAF50' }}>{analysisResult.processes.length} 个</span></p>
              <table className="process-table">
                <thead><tr><th>工艺名称</th><th>款式</th><th>单次工时</th><th>次数</th><th>小计工时</th><th>测试状态</th></tr></thead>
                <tbody>
                  {analysisResult.processes.map((p) => (
                    <tr key={p.id}>
                      <td>{p.process_name}</td><td>{p.style}</td><td>{formatSeconds(p.work_seconds)}</td>
                      <td style={{ textAlign: 'center', color: '#ff9800', fontWeight: 'bold' }}>{p.selected_count} 次</td>
                      <td style={{ color: '#2196F3', fontWeight: 'bold' }}>{formatSeconds(p.work_seconds * p.selected_count)}</td>
                      <td>{p.is_tested ? '已测试' : '未测试'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                    <td colSpan={2}>总计</td><td>—</td>
                    <td style={{ textAlign: 'center', color: '#ff9800' }}>{analysisResult.totalItems} 次</td>
                    <td>{formatSeconds(analysisResult.totalSeconds)}</td><td>—</td>
                  </tr>
                </tbody>
              </table>
              <div className="result-grid">
                <div className="result-item"><div className="result-label">总工时</div><div className="result-value">{formatSeconds(analysisResult.totalSeconds)}</div><div className="result-note">{analysisResult.totalSeconds.toLocaleString()} 秒<br />≈ {analysisResult.totalHours} 小时</div></div>
                <div className="result-item"><div className="result-label">单人日产量</div><div className="result-value">{analysisResult.dailyOutput} 件/天</div><div className="result-note">按每日 {formatSeconds(DAILY_SECONDS)} 计算</div></div>
                <div className="result-item"><div className="result-label">单件工价</div><div className="result-value">{analysisResult.laborCost} 元</div><div className="result-note">时薪 {HOURLY_RATE} 元/小时</div></div>
                <div className="result-item"><div className="result-label">日工价总额</div><div className="result-value">{analysisResult.dailyLaborCost} 元</div><div className="result-note">{analysisResult.dailyOutput} × {analysisResult.laborCost}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="footer">
        <p>IE工时管理系统（秒为单位）- 支持工艺次数设置<br />丰之玲 © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
