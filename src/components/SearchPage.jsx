import { useState, useEffect, useMemo } from 'react';
import { fetchStockInfo } from '../api/finmind';
import './SearchPage.css';

const POPULAR_GROUPS = [
  {
    label: '半導體',
    color: '#38bdf8',
    stocks: [
      { id: '2330', name: '台積電' },
      { id: '2454', name: '聯發科' },
      { id: '2303', name: '聯電' },
      { id: '3711', name: '日月光投控' },
      { id: '2379', name: '瑞昱' },
    ],
  },
  {
    label: 'AI / 伺服器',
    color: '#a78bfa',
    stocks: [
      { id: '6669', name: '緯穎' },
      { id: '2382', name: '廣達' },
      { id: '3231', name: '緯創' },
      { id: '2356', name: '英業達' },
      { id: '2301', name: '光寶科' },
    ],
  },
  {
    label: '科技硬體',
    color: '#34d399',
    stocks: [
      { id: '2317', name: '鴻海' },
      { id: '2308', name: '台達電' },
      { id: '2357', name: '華碩' },
      { id: '2395', name: '研華' },
      { id: '3008', name: '大立光' },
    ],
  },
  {
    label: '金融',
    color: '#f59e0b',
    stocks: [
      { id: '2881', name: '富邦金' },
      { id: '2882', name: '國泰金' },
      { id: '2886', name: '兆豐金' },
      { id: '2891', name: '中信金' },
      { id: '2884', name: '玉山金' },
    ],
  },
  {
    label: '傳產 / 電信',
    color: '#fb7185',
    stocks: [
      { id: '2412', name: '中華電' },
      { id: '6505', name: '台塑化' },
      { id: '1301', name: '台塑' },
      { id: '2002', name: '中鋼' },
      { id: '1303', name: '南亞' },
    ],
  },
];

const INDUSTRIES = ['全部'];

export default function SearchPage({ onSelect }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('全部');

  useEffect(() => {
    fetchStockInfo()
      .then(data => {
        // 只保留 4 碼數字股票代號
        const fourDigit = data.filter(s => /^\d{4}$/.test(s.stock_id));
        // 去重：同一 stock_id 只保留 date 最新的一筆（API 會對同支股票回傳多筆）
        const map = new Map();
        for (const s of fourDigit) {
          const existing = map.get(s.stock_id);
          if (!existing || (s.date || '') >= (existing.date || '')) {
            map.set(s.stock_id, s);
          }
        }
        // 依股票代號排序
        const deduped = Array.from(map.values()).sort((a, b) =>
          a.stock_id.localeCompare(b.stock_id)
        );
        setStocks(deduped);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const industries = useMemo(() => {
    const set = new Set(stocks.map(s => s.industry_category).filter(Boolean));
    return ['全部', ...Array.from(set).sort()];
  }, [stocks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks.filter(s => {
      const matchQuery =
        !q ||
        s.stock_id.includes(q) ||
        (s.stock_name || '').toLowerCase().includes(q);
      const matchIndustry =
        industry === '全部' || s.industry_category === industry;
      return matchQuery && matchIndustry;
    });
  }, [stocks, query, industry]);

  // 熱門股票點擊：若清單已載入則用完整資料，否則用預設資訊
  function handlePopularClick(popular) {
    const found = stocks.find(s => s.stock_id === popular.id);
    onSelect(found || { stock_id: popular.id, stock_name: popular.name, industry_category: '' });
  }

  return (
    <div className="search-page">
      <header className="search-header">
        <div className="search-header-inner">
          <div className="search-brand">
            <div className="search-logo">📈</div>
            <div>
              <h1>台股儀表板</h1>
              <p>搜尋股票，查看完整分析資料</p>
            </div>
          </div>
        </div>
      </header>

      <div className="search-body">
        {/* 搜尋列 */}
        <div className="search-bar-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="輸入股票代號或名稱，例如：2330、台積電"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* 熱門股票 */}
        {!query && (
          <div className="popular-section">
            <div className="popular-title">熱門股票</div>
            <div className="popular-groups">
              {POPULAR_GROUPS.map(group => (
                <div key={group.label} className="popular-group">
                  <span className="popular-group-label" style={{ color: group.color }}>
                    {group.label}
                  </span>
                  <div className="popular-chips">
                    {group.stocks.map(s => (
                      <button
                        key={s.id}
                        className="popular-chip"
                        style={{ '--chip-color': group.color }}
                        onClick={() => handlePopularClick(s)}
                      >
                        <span className="chip-id">{s.id}</span>
                        <span className="chip-name">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 產業篩選 */}
        {!loading && (
          <div className="industry-filter">
            {industries.map(ind => (
              <button
                key={ind}
                className={`ind-btn ${industry === ind ? 'active' : ''}`}
                onClick={() => setIndustry(ind)}
              >
                {ind}
              </button>
            ))}
          </div>
        )}

        {/* 狀態顯示 */}
        {loading && (
          <div className="search-status">
            <span className="spinner" />
            載入股票清單中…
          </div>
        )}
        {error && (
          <div className="search-status error">載入失敗：{error}</div>
        )}

        {/* 結果數量 */}
        {!loading && !error && (
          <div className="result-count">
            共 {filtered.length} 筆
            {query && <span> · 搜尋「{query}」</span>}
            {industry !== '全部' && <span> · {industry}</span>}
          </div>
        )}

        {/* 股票列表 */}
        <div className="stock-grid">
          {filtered.slice(0, 200).map((s, i) => (
            <button
              key={`${s.stock_id}-${i}`}
              className="stock-card"
              onClick={() => onSelect(s)}
            >
              <span className="stock-card-id">{s.stock_id}</span>
              <span className="stock-card-name">{s.stock_name || '—'}</span>
              {s.industry_category && (
                <span className="stock-card-ind">{s.industry_category}</span>
              )}
            </button>
          ))}
          {filtered.length > 200 && (
            <div className="search-status">顯示前 200 筆，請縮小搜尋範圍</div>
          )}
        </div>
      </div>
    </div>
  );
}
