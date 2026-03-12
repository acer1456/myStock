import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchDividend, fetchDividendResult } from '../api/finmind';

export default function Dividend({ stockId, dateRange }) {
  const [dividends, setDividends] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchDividend(stockId, dateRange.startDate, dateRange.endDate), fetchDividendResult(stockId, dateRange.startDate, dateRange.endDate)])
      .then(([divs, res]) => {
        const sorted = [...divs].sort((a, b) => a.date.localeCompare(b.date));
        const recent = sorted.map(r => ({
          year: r.year,
          現金股利: parseFloat((r.CashEarningsDistribution + r.CashStatutorySurplus).toFixed(2)),
          股票股利: parseFloat((r.StockEarningsDistribution + r.StockStatutorySurplus).toFixed(2)),
          除息日: r.CashExDividendTradingDate,
        }));
        setDividends(recent);
        const resSorted = [...res].sort((a, b) => a.date.localeCompare(b.date));
        setResults(resSorted);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <div className="card-loading">載入中...</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;
  if (!dividends.length) return <div className="card-error">無資料（試著選年3年以上的時間範圍）</div>;

  const latest = dividends[dividends.length - 1];
  const totalDiv = latest ? (latest.現金股利 + latest.股票股利).toFixed(2) : '—';

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">最近現金股利</span>
          <span className="stat-value highlight">{latest?.現金股利} 元</span>
          <span className="stat-sub">{latest?.year}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">最近股票股利</span>
          <span className="stat-value highlight">{latest?.股票股利} 元</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">合計配息</span>
          <span className="stat-value up">{totalDiv} 元</span>
        </div>
      </div>

      <div className="chart-container">
        <p className="chart-subtitle">歷年股利（近8年）</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dividends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={50}
              tickFormatter={v => v + '元'} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(v, n) => [v + ' 元', n]} />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Bar dataKey="現金股利" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="股票股利" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {results.length > 0 && (
        <div className="table-container">
          <p className="chart-subtitle">除權息結果（近5筆）</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>除前價</th>
                <th>除後參考價</th>
                <th>股利合計</th>
                <th>開盤參考</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.before_price}</td>
                  <td>{r.after_price}</td>
                  <td className="up">{r.stock_and_cache_dividend}</td>
                  <td>{r.open_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
