import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fetchInstitutional } from '../api/finmind';

export default function InstitutionalInvestors({ stockId, dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchInstitutional(stockId, dateRange.startDate, dateRange.endDate)
      .then(raw => {
        // API name 欄位為英文：Foreign_Investor / Foreign_Dealer_Self / Investment_Trust / Dealer_self / Dealer_Hedging
        // buy/sell 單位為「股」，除以 1000 轉為「張」
        const byDate = {};
        raw.forEach(r => {
          if (!byDate[r.date]) byDate[r.date] = { date: r.date.slice(5), 外資: 0, 投信: 0, 自營商: 0 };
          const net = Math.round(((r.buy || 0) - (r.sell || 0)) / 1000);
          const n = r.name || '';
          if (n === 'Foreign_Investor' || n === 'Foreign_Dealer_Self') {
            byDate[r.date]['外資'] += net;
          } else if (n === 'Investment_Trust') {
            byDate[r.date]['投信'] += net;
          } else if (n === 'Dealer_self' || n === 'Dealer_Hedging') {
            byDate[r.date]['自營商'] += net;
          }
        });
        const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
        setData(sorted);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!data.length) return <div className="card-error">無資料</div>;

  // Calculate cumulative
  const calcTotal = (key) => data.reduce((s, d) => s + (d[key] || 0), 0);
  const foreignTotal = calcTotal('外資');
  const trustTotal = calcTotal('投信');
  const dealerTotal = calcTotal('自營商');

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">外資累積（張）</span>
          <span className={`stat-value ${foreignTotal >= 0 ? 'up' : 'down'}`}>
            {foreignTotal >= 0 ? '+' : ''}{foreignTotal.toLocaleString()}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">投信累積（張）</span>
          <span className={`stat-value ${trustTotal >= 0 ? 'up' : 'down'}`}>
            {trustTotal >= 0 ? '+' : ''}{trustTotal.toLocaleString()}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">自營商累積（張）</span>
          <span className={`stat-value ${dealerTotal >= 0 ? 'up' : 'down'}`}>
            {dealerTotal >= 0 ? '+' : ''}{dealerTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">三大法人每日買賣超（張，{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={70}
              tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v, n) => [v.toLocaleString() + ' 張', n]} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <ReferenceLine y={0} stroke="#475569" />
            <Bar dataKey="外資" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="投信" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="自營商" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
