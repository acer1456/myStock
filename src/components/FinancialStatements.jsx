import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchFinancialStatements } from '../api/finmind';

const KEY_ITEMS = [
  'Revenue', 'GrossProfit', 'OperatingIncome', 'NetIncome',
  'EPS', 'EBITDA', 'OperatingExpenses'
];

const KEY_LABELS = {
  Revenue: '營業收入',
  GrossProfit: '毛利',
  OperatingIncome: '營業利益',
  NetIncome: '稅後淨利',
  EPS: 'EPS',
  EBITDA: 'EBITDA',
  OperatingExpenses: '營業費用',
};

export default function FinancialStatements({ stockId, dateRange }) {
  const [chartData, setChartData] = useState([]);
  const [latestQuarter, setLatestQuarter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFinancialStatements(stockId, dateRange.startDate, dateRange.endDate)
      .then(raw => {
        // Group by date
        const byDate = {};
        raw.forEach(r => {
          if (!byDate[r.date]) byDate[r.date] = { date: r.date.slice(0, 7) };
          if (KEY_ITEMS.includes(r.type)) {
            byDate[r.date][r.type] = r.value;
          }
        });
        const dates = Object.keys(byDate).sort();
        const formatted = dates.map(d => byDate[d]);
        setChartData(formatted);
        if (formatted.length) setLatestQuarter(formatted[formatted.length - 1]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!chartData.length) return <div className="card-error">無資料</div>;

  const fmt = (v) => {
    if (v === undefined || v === null) return '—';
    if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(0) + '億';
    if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(0) + '萬';
    return v.toFixed(2);
  };

  return (
    <div>
      <div className="stats-grid">
        {KEY_ITEMS.filter(k => k !== 'OperatingExpenses').map(key => (
          <div key={key} className="stat-box">
            <span className="stat-label">{KEY_LABELS[key]}</span>
            <span className="stat-value highlight">{fmt(latestQuarter[key])}</span>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">營收 / 毛利 / 淨利 趨勢（近12季，億元）</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={Math.floor(chartData.length / 4)} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={65}
              tickFormatter={v => (v / 1e8).toFixed(0) + '億'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v, n) => [fmt(v), KEY_LABELS[n] || n]} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} formatter={v => KEY_LABELS[v] || v} />
            <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="GrossProfit" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="NetIncome" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">EPS 趨勢（近12季）</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={Math.floor(chartData.length / 4)} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={50}
              tickFormatter={v => v?.toFixed(1) || ''} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v) => [v?.toFixed(2), 'EPS']} />
            <Line type="monotone" dataKey="EPS" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
