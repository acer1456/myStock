import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchShareholding } from '../api/finmind';

export default function Shareholding({ stockId, dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchShareholding(stockId, dateRange.startDate, dateRange.endDate)
      .then(raw => {
        const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
        setData(sorted.map(r => ({
          date: r.date.slice(5),
          外資持股比率: parseFloat(r.ForeignInvestmentSharesRatio?.toFixed(2)),
          外資持股上限: parseFloat(r.ForeignInvestmentUpperLimitRatio?.toFixed(2)),
          外資持股張數: Math.round(r.ForeignInvestmentShares / 1000),
        })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!data.length) return <div className="card-error">無資料</div>;

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = latest && prev ? (latest.外資持股比率 - prev.外資持股比率).toFixed(2) : '0';

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">外資持股比率</span>
          <span className="stat-value highlight">{latest?.外資持股比率}%</span>
          <span className={`stat-sub ${parseFloat(change) >= 0 ? 'up' : 'down'}`}>
            {parseFloat(change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(change))}%
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">外資持股上限</span>
          <span className="stat-value">{latest?.外資持股上限}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">外資持股（千張）</span>
          <span className="stat-value highlight">{latest?.外資持股張數?.toLocaleString()}</span>
        </div>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">外資持股比率趨勢（{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="shareGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} width={55}
              tickFormatter={v => v + '%'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v, n) => [v + '%', n]} />
            <Area type="monotone" dataKey="外資持股比率" stroke="#10b981" fill="url(#shareGrad)"
              strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
