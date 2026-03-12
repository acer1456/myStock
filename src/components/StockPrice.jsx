import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { fetchStockPrice } from '../api/finmind';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StockPrice({ stockId, dateRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStockPrice(stockId, dateRange.startDate, dateRange.endDate)
      .then(d => {
        const formatted = d.map(row => ({
          date: row.date.slice(5),
          open: row.open,
          close: row.close,
          max: row.max,
          min: row.min,
          volume: Math.round(row.Trading_Volume / 1000),
          spread: row.spread,
        }));
        setData(formatted);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入股價資料中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!data.length) return <div className="card-error">無資料</div>;

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = latest ? (latest.close - (prev?.close || latest.close)) : 0;
  const changePct = prev ? ((change / prev.close) * 100).toFixed(2) : '0.00';
  const isUp = change >= 0;

  return (
    <div>
      <div className="price-header">
        <span className={`price-value ${isUp ? 'up' : 'down'}`}>
          ${latest?.close?.toFixed(2)}
        </span>
        <span className={`price-change ${isUp ? 'up' : 'down'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({isUp ? '+' : ''}{changePct}%)
        </span>
        <span className="price-date">最後更新：{data[data.length-1]?.date}</span>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">今日最高</span>
          <span className="stat-value up">{latest?.max}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">今日最低</span>
          <span className="stat-value down">{latest?.min}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">今日開盤</span>
          <span className="stat-value">{latest?.open}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">成交量(千股)</span>
          <span className="stat-value">{latest?.volume?.toLocaleString()}</span>
        </div>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">收盤價走勢（{dateRange.startDate} ～ {dateRange.endDate}）</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={v => v.toFixed(0)} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="close" name="收盤價" stroke="#3b82f6"
              fill="url(#priceGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">每日成交量（千股）</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={Math.floor(data.length / 6)} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={60}
              tickFormatter={v => (v / 1000).toFixed(0) + 'M'} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" name="成交量(千)" fill="#6366f1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
