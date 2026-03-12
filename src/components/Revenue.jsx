import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { fetchMonthRevenue } from '../api/finmind';

export default function Revenue({ stockId, dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // 往前多抓12個月，確保 YoY 計算有對應資料
    const extStart = new Date(dateRange.startDate);
    extStart.setFullYear(extStart.getFullYear() - 1);
    const fetchStart = extStart.toISOString().slice(0, 10);
    fetchMonthRevenue(stockId, fetchStart, dateRange.endDate)
      .then(raw => {
        const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
        const formatted = sorted.map((r, i) => {
          const rev = Math.round(r.revenue / 1e8); // 億元
          const prev = sorted[i - 12];
          const yoy = prev ? ((r.revenue - prev.revenue) / prev.revenue * 100).toFixed(1) : null;
          return {
            date: r.date.slice(0, 7),
            營收億: rev,
            年增率: yoy !== null ? parseFloat(yoy) : null,
          };
        });
        // 只顯示使用者選取區間內的資料
        setData(formatted.filter(d => d.date >= dateRange.startDate.slice(0, 7)));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!data.length) return <div className="card-error">無資料</div>;

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const momChange = latest && prev ? ((latest.營收億 - prev.營收億) / prev.營收億 * 100).toFixed(1) : null;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">最新月營收</span>
          <span className="stat-value highlight">{latest?.營收億?.toLocaleString()} 億</span>
          <span className="stat-sub">{latest?.date}</span>
        </div>
        {momChange !== null && (
          <div className="stat-box">
            <span className="stat-label">月增率</span>
            <span className={`stat-value ${parseFloat(momChange) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(momChange) >= 0 ? '+' : ''}{momChange}%
            </span>
          </div>
        )}
        {latest?.年增率 !== null && (
          <div className="stat-box">
            <span className="stat-label">年增率 (YoY)</span>
            <span className={`stat-value ${parseFloat(latest.年增率) >= 0 ? 'up' : 'down'}`}>
              {parseFloat(latest.年增率) >= 0 ? '+' : ''}{latest.年增率}%
            </span>
          </div>
        )}
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">月營收及年増率（{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis yAxisId="rev" tick={{ fill: '#94a3b8', fontSize: 11 }} width={60}
              tickFormatter={v => v + '億'} />
            <YAxis yAxisId="yoy" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55}
              tickFormatter={v => v + '%'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v, n) => [n === '營收億' ? v + ' 億' : v + '%', n]} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Bar yAxisId="rev" dataKey="營收億" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Line yAxisId="yoy" type="monotone" dataKey="年增率" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
