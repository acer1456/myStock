import { useState, useEffect } from 'react';
import { fetchNews } from '../api/finmind';

export default function News({ stockId, dateRange }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNews(stockId, dateRange.endDate)
      .then(raw => setNews(raw.slice(0, 10)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [dateRange.endDate]);

  if (loading) return <div className="card-loading">載入新聞中...</div>;
  if (error) return <div className="card-error">暫無新聞或發生錯誤：{error}</div>;
  if (!news.length) return <div className="card-empty">{dateRange.endDate} 暫無相關新聞</div>;

  return (
    <div className="news-list">
      {news.map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noreferrer" className="news-item">
          <div className="news-meta">
            <span className="news-source">{n.source}</span>
            <span className="news-date">{n.date}</span>
          </div>
          <h4 className="news-title">{n.title}</h4>
          {n.description && (
            <p className="news-desc">{n.description.slice(0, 100)}{n.description.length > 100 ? '...' : ''}</p>
          )}
        </a>
      ))}
    </div>
  );
}
