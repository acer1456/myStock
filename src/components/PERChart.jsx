import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchStockPER } from '../api/finmind';

export default function PERChart({ stockId, dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStockPER(stockId, dateRange.startDate, dateRange.endDate)
      .then(d => setData(d.map(r => ({
        date: r.date.slice(5),
        PER: parseFloat(r.PER?.toFixed(2)),
        PBR: parseFloat(r.PBR?.toFixed(2)),
        殖利率: parseFloat(r.dividend_yield?.toFixed(2)),
      }))))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!data.length) return <div className="card-error">無資料</div>;

  const latest = data[data.length - 1];

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">本益比 PER</span>
          <span className="stat-value highlight">{latest?.PER}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">股價淨值比 PBR</span>
          <span className="stat-value highlight">{latest?.PBR}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">殖利率</span>
          <span className="stat-value highlight">{latest?.殖利率}%</span>
        </div>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">PER / PBR 趨勢（{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis yAxisId="per" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} width={50} />
            <YAxis yAxisId="pbr" orientation="right" domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} width={50} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Line yAxisId="per" type="monotone" dataKey="PER" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line yAxisId="pbr" type="monotone" dataKey="PBR" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">殖利率趨勢（{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} width={50}
              tickFormatter={v => v + '%'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={v => [v + '%', '殖利率']} />
            <Line type="monotone" dataKey="殖利率" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
