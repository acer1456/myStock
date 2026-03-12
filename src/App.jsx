import { useState } from 'react';
import './App.css';
import StockPrice from './components/StockPrice';
import PERChart from './components/PERChart';
import InstitutionalInvestors from './components/InstitutionalInvestors';
import MarginPurchase from './components/MarginPurchase';
import Revenue from './components/Revenue';
import Dividend from './components/Dividend';
import FinancialStatements from './components/FinancialStatements';
import Shareholding from './components/Shareholding';
import News from './components/News';
import DateRangePicker from './components/DateRangePicker';
import SearchPage from './components/SearchPage';
import Overview from './components/Overview';

const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);
const DEFAULT_START = fmt(new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()));
const DEFAULT_END = fmt(today);

const TABS = [
  { id: 'overview', label: '總覽' },
  { id: 'price', label: '股價行情' },
  { id: 'per', label: 'PER / PBR' },
  { id: 'institutional', label: '三大法人' },
  { id: 'margin', label: '融資融券' },
  { id: 'shareholding', label: '外資持股' },
  { id: 'revenue', label: '月營收' },
  { id: 'financial', label: '財務報表' },
  { id: 'dividend', label: '股利政策' },
  { id: 'news', label: '最新消息' },
];

const NO_DATE_PICKER_TABS = ['news', 'overview'];

function App() {
  const [page, setPage] = useState('search'); // 'search' | 'detail'
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: DEFAULT_START,
    endDate: DEFAULT_END,
    preset: '3個月',
  });

  function handleSelectStock(stock) {
    setSelectedStock(stock);
    setActiveTab('overview');
    setDateRange({
      startDate: DEFAULT_START,
      endDate: DEFAULT_END,
      preset: '3個月',
    });
    setPage('detail');
  }

  function handleBackToSearch() {
    setPage('search');
  }

  if (page === 'search') {
    return <SearchPage onSelect={handleSelectStock} />;
  }

  const sid = selectedStock?.stock_id || '';
  const sname = selectedStock?.stock_name || sid;

  const renderContent = () => {
    const dr = dateRange;
    switch (activeTab) {
      case 'overview': return <Overview stockId={sid} />;
      case 'price': return <StockPrice stockId={sid} dateRange={dr} />;
      case 'per': return <PERChart stockId={sid} dateRange={dr} />;
      case 'institutional': return <InstitutionalInvestors stockId={sid} dateRange={dr} />;
      case 'margin': return <MarginPurchase stockId={sid} dateRange={dr} />;
      case 'shareholding': return <Shareholding stockId={sid} dateRange={dr} />;
      case 'revenue': return <Revenue stockId={sid} dateRange={dr} />;
      case 'financial': return <FinancialStatements stockId={sid} dateRange={dr} />;
      case 'dividend': return <Dividend stockId={sid} dateRange={dr} />;
      case 'news': return <News stockId={sid} dateRange={dr} />;
      default: return null;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <button className="back-btn" onClick={handleBackToSearch} title="返回搜尋">
              ← 返回
            </button>
            <div className="stock-badge">{sid}</div>
            <div>
              <h1>{sname} <span className="stock-id">{sid}</span></h1>
              {selectedStock?.industry_category && (
                <p className="header-sub">{selectedStock.industry_category}</p>
              )}
            </div>
          </div>
          <div className="header-source">
            <span>資料來源：</span>
            <a href="https://finmindtrade.com/" target="_blank" rel="noreferrer">FinMind</a>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <div className="tab-list">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-card">
          <h2 className="section-title">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {!NO_DATE_PICKER_TABS.includes(activeTab) && (
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          )}
          {renderContent()}
        </div>
      </main>

      <footer className="app-footer">
        <p>資料由 FinMind API 提供 · 僅供參考，不構成投資建議</p>
      </footer>
    </div>
  );
}

export default App;
