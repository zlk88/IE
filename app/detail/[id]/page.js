import Link from 'next/link';
import sql from '@/lib/db';
import {
  DAILY_SECONDS, HOURLY_RATE, formatSeconds, secondsToHours,
  calculateDailyOutput, calculateLaborCost,
} from '@/lib/utils';

export default async function DetailPage({ params }) {
  const id = parseInt(params.id, 10);
  const rows = await sql`SELECT * FROM processes1 WHERE id = ${id}`;
  if (rows.length === 0) {
    return <div className="container"><div className="card">工艺不存在</div></div>;
  }
  const p = rows[0];
  const totalSeconds = p.work_seconds;
  const totalHours = secondsToHours(totalSeconds);
  const dailyOutput = calculateDailyOutput(totalSeconds);
  const laborCost = calculateLaborCost(totalSeconds);
  const dailyLaborCost = Math.round(laborCost * dailyOutput * 100) / 100;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return (
    <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '2px solid #4CAF50' }}>
          <h1 style={{ color: '#333', fontSize: 28 }}>工艺详情</h1>
          <p style={{ color: '#666' }}>工时分析与管理</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
          <div className="result-item">
            <div className="result-label">工艺名称</div>
            <div className="result-value" style={{ fontSize: 20 }}>{p.process_name}</div>
          </div>
          <div className="result-item">
            <div className="result-label">款式</div>
            <div className="result-value" style={{ fontSize: 20 }}>{p.style}</div>
          </div>
          <div className="result-item">
            <div className="result-label">工时</div>
            <div className="result-value" style={{ fontSize: 20 }}>{p.work_seconds} 秒</div>
            <div className="result-note">{formatSeconds(p.work_seconds)}</div>
            <div className="result-note">{hours}小时 {minutes}分 {secs}秒</div>
          </div>
          <div className="result-item">
            <div className="result-label">测试状态</div>
            <div className="result-value" style={{ fontSize: 20 }}>{p.is_tested ? '✅ 已测试' : '⚠️ 未测试'}</div>
          </div>
        </div>

        {p.specification && (
          <div style={{ background: '#fff8e1', padding: 20, borderRadius: 10, marginBottom: 20, borderLeft: '4px solid #ff9800' }}>
            <h3 style={{ marginBottom: 10 }}>规格要求</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{p.specification}</div>
          </div>
        )}

        <div style={{ background: '#e8f5e9', padding: 20, borderRadius: 10, marginBottom: 30, borderLeft: '4px solid #4CAF50' }}>
          <h3 style={{ marginBottom: 10 }}>工艺说明</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {p.description || <span style={{ color: '#999' }}>暂无工艺说明</span>}
          </div>
        </div>

        <h2 style={{ marginBottom: 20, textAlign: 'center' }}>单工艺分析结果</h2>
        <div className="result-grid">
          <div className="result-item">
            <div className="result-label">单人日产量</div>
            <div className="result-value">{dailyOutput} 件/天</div>
            <div className="result-note">基于每日 {formatSeconds(DAILY_SECONDS)}</div>
          </div>
          <div className="result-item">
            <div className="result-label">单件工价</div>
            <div className="result-value">{laborCost} 元</div>
            <div className="result-note">时薪 {HOURLY_RATE} 元/小时，工时 {totalHours} 小时</div>
          </div>
          <div className="result-item">
            <div className="result-label">单人日工价</div>
            <div className="result-value">{dailyLaborCost} 元</div>
            <div className="result-note">{dailyOutput} × {laborCost}</div>
          </div>
          <div className="result-item">
            <div className="result-label">工时占比</div>
            <div className="result-value">{Math.round((totalHours / (DAILY_SECONDS / 3600)) * 1000) / 10}%</div>
            <div className="result-note">占每日工作时间比例</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 40, justifyContent: 'center' }}>
          <Link href={`/edit/${p.id}`} className="btn btn-secondary" style={{ padding: '12px 24px' }}>编辑工艺</Link>
          <Link href="/" className="btn btn-secondary" style={{ padding: '12px 24px', background: '#6c757d' }}>返回首页</Link>
        </div>
      </div>
    </div>
  );
}
