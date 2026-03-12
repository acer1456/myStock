import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchMarginPurchase } from '../api/finmind';

export default function MarginPurchase({ stockId, dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMarginPurchase(stockId, dateRange.startDate, dateRange.endDate)
      .then(raw => {
        setData(raw.map(r => ({
          date: r.date.slice(5),
          融資餘額: r.MarginPurchaseTodayBalance,
          融券餘額: r.ShortSaleTodayBalance,
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
  const marginChange = latest && prev ? latest.融資餘額 - prev.融資餘額 : 0;
  const shortChange = latest && prev ? latest.融券餘額 - prev.融券餘額 : 0;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">融資餘額（張）</span>
          <span className="stat-value highlight">{latest?.融資餘額?.toLocaleString()}</span>
          <span className={`stat-sub ${marginChange >= 0 ? 'up' : 'down'}`}>
            {marginChange >= 0 ? '▲' : '▼'} {Math.abs(marginChange).toLocaleString()}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">融券餘額（張）</span>
          <span className="stat-value highlight">{latest?.融券餘額?.toLocaleString()}</span>
          <span className={`stat-sub ${shortChange >= 0 ? 'up' : 'down'}`}>
            {shortChange >= 0 ? '▲' : '▼'} {Math.abs(shortChange).toLocaleString()}
          </span>
        </div>
        {latest?.融券餘額 && latest?.融資餘額 && (
          <div className="stat-box">
            <span className="stat-label">券資比</span>
            <span className="stat-value highlight">
              {((latest.融券餘額 / latest.融資餘額) * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">融資融券餘額趨勢（{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis yAxisId="margin" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70}
              tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
            <YAxis yAxisId="short" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} width={60}
              tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v, n) => [v.toLocaleString() + ' 張', n]} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Line yAxisId="margin" type="monotone" dataKey="融資餘額" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line yAxisId="short" type="monotone" dataKey="融券餘額" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
