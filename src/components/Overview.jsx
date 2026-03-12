import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import {
  fetchStockPrice, fetchStockPER, fetchInstitutional,
  fetchMarginPurchase, fetchShareholding, fetchMonthRevenue,
  fetchFinancialStatements, fetchDividend,
} from '../api/finmind';
import './Overview.css';

const fmtDate = (d) => d.toISOString().slice(0, 10);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDate(d);
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return fmtDate(d);
}

function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return fmtDate(d);
}

const TODAY = fmtDate(new Date());

// 捷徑：取陣列最後一筆
const last = (arr) => arr[arr.length - 1];

export default function Overview({ stockId }) {
  const [state, setState] = useState({
    price: null,
    per: null,
    institutional: null,
    margin: null,
    shareholding: null,
    revenue: null,
    financial: null,
    dividend: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stockId) return;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetchStockPrice(stockId, daysAgo(30), TODAY),
      fetchStockPER(stockId, daysAgo(30), TODAY),
      fetchInstitutional(stockId, daysAgo(30), TODAY),
      fetchMarginPurchase(stockId, daysAgo(30), TODAY),
      fetchShareholding(stockId, monthsAgo(3), TODAY),
      fetchMonthRevenue(stockId, yearsAgo(2), TODAY),
      fetchFinancialStatements(stockId, yearsAgo(3), TODAY),
      fetchDividend(stockId, yearsAgo(7), TODAY),
    ]).then(([price, per, inst, margin, share, rev, fin, div]) => {
      const g = (r) => (r.status === 'fulfilled' ? r.value : []);
      setState({
        price: g(price),
        per: g(per),
        institutional: g(inst),
        margin: g(margin),
        shareholding: g(share),
        revenue: g(rev),
        financial: g(fin),
        dividend: g(div),
      });
    }).finally(() => setLoading(false));
  }, [stockId]);

  if (loading) return <div className="card-loading">載入總覽資料中…</div>;
  if (error) return <div className="card-error">錯誤：{error}</div>;

  /* ── 1. 股價 ── */
  const priceList = [...(state.price || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestPrice = last(priceList);
  const prevPrice = priceList[priceList.length - 2];
  const priceChange = latestPrice && prevPrice
    ? (latestPrice.close - prevPrice.close) : 0;
  const pricePct = prevPrice
    ? ((priceChange / prevPrice.close) * 100).toFixed(2) : '0.00';
  const isUp = priceChange >= 0;

  /* ── 2. PER / PBR ── */
  const perList = [...(state.per || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestPer = last(perList);

  /* ── 3. 三大法人（期間累積） ── */
  const instRaw = state.institutional || [];
  const instByDate = {};
  instRaw.forEach(r => {
    if (!instByDate[r.date]) instByDate[r.date] = { 外資: 0, 投信: 0, 自營商: 0 };
    const net = Math.round(((r.buy || 0) - (r.sell || 0)) / 1000);
    const n = r.name || '';
    if (n === 'Foreign_Investor' || n === 'Foreign_Dealer_Self') instByDate[r.date]['外資'] += net;
    else if (n === 'Investment_Trust') instByDate[r.date]['投信'] += net;
    else if (n === 'Dealer_self' || n === 'Dealer_Hedging') instByDate[r.date]['自營商'] += net;
  });
  const instDates = Object.keys(instByDate).sort();
  const latestInstDate = instDates[instDates.length - 1];
  const latestInst = latestInstDate ? instByDate[latestInstDate] : { 外資: 0, 投信: 0, 自營商: 0 };
  const instCumul = { 外資: 0, 投信: 0, 自營商: 0 };
  instDates.forEach(d => {
    instCumul['外資'] += instByDate[d]['外資'];
    instCumul['投信'] += instByDate[d]['投信'];
    instCumul['自營商'] += instByDate[d]['自營商'];
  });
  const instBarData = [
    { name: '外資', today: latestInst['外資'], cumul: instCumul['外資'] },
    { name: '投信', today: latestInst['投信'], cumul: instCumul['投信'] },
    { name: '自營商', today: latestInst['自營商'], cumul: instCumul['自營商'] },
  ];

  /* ── 4. 融資融券 ── */
  const marginList = [...(state.margin || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestMargin = last(marginList);
  const prevMargin = marginList[marginList.length - 2];
  const marginBalChange = latestMargin && prevMargin
    ? Math.round((latestMargin.MarginPurchaseTodayBalance - prevMargin.MarginPurchaseTodayBalance) / 1000)
    : 0;
  const shortBalChange = latestMargin && prevMargin
    ? Math.round((latestMargin.ShortSaleTodayBalance - prevMargin.ShortSaleTodayBalance) / 1000)
    : 0;

  /* ── 5. 外資持股 ── */
  const shareList = [...(state.shareholding || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestShare = last(shareList);
  const shareRatio = latestShare?.ForeignInvestmentSharesRatio?.toFixed(2);
  const shareLimit = latestShare?.ForeignInvestmentUpperLimitRatio?.toFixed(2);
  const shareUsed = shareRatio && shareLimit
    ? ((parseFloat(shareRatio) / parseFloat(shareLimit)) * 100).toFixed(1)
    : null;

  /* ── 6. 月營收 ── */
  const revRaw = [...(state.revenue || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestRev = last(revRaw);
  const prevYearRev = revRaw[revRaw.length - 13];
  const revYoY = latestRev && prevYearRev
    ? (((latestRev.revenue - prevYearRev.revenue) / prevYearRev.revenue) * 100).toFixed(1)
    : null;
  const prevRevRow = revRaw[revRaw.length - 2];
  const revMoM = latestRev && prevRevRow
    ? (((latestRev.revenue - prevRevRow.revenue) / prevRevRow.revenue) * 100).toFixed(1)
    : null;

  /* ── 7. 財報 ── */
  const finRaw = state.financial || [];
  const byDate = {};
  finRaw.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date };
    byDate[r.date][r.type] = r.value;
  });
  const finDates = Object.keys(byDate).sort();
  const latestFin = byDate[finDates[finDates.length - 1]] || {};
  const grossRate = latestFin.Revenue && latestFin.GrossProfit
    ? ((latestFin.GrossProfit / latestFin.Revenue) * 100).toFixed(1)
    : null;
  const opRate = latestFin.Revenue && latestFin.OperatingIncome
    ? ((latestFin.OperatingIncome / latestFin.Revenue) * 100).toFixed(1)
    : null;
  const netRate = latestFin.Revenue && latestFin.NetIncome
    ? ((latestFin.NetIncome / latestFin.Revenue) * 100).toFixed(1)
    : null;

  const finRadarData = [
    { subject: '毛利率', value: grossRate ? parseFloat(grossRate) : 0 },
    { subject: '營益率', value: opRate ? parseFloat(opRate) : 0 },
    { subject: '淨利率', value: netRate ? parseFloat(netRate) : 0 },
  ];

  /* ── 8. 股利 ── */
  const divRaw = [...(state.dividend || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestDiv = last(divRaw);

  /* ── 輔助 ── */
  const fmtBig = (v) => {
    if (!v && v !== 0) return '—';
    if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(0) + '億';
    if (Math.abs(v) >= 1e4) return (v / 1e4).toFixed(0) + '萬';
    return v.toFixed(2);
  };
  const sign = (v) => (v > 0 ? '+' : '');

  return (
    <div className="overview">

      {/* ═══ 股價主橫幅 ═══ */}
      <div className={`ov-hero ${isUp ? 'hero-up' : 'hero-down'}`}>
        <div className="ov-hero-price">
          <span className="hero-close">{latestPrice?.close?.toFixed(2) ?? '—'}</span>
          <span className={`hero-change ${isUp ? 'up' : 'down'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}（{isUp ? '+' : ''}{pricePct}%）
          </span>
        </div>
        <div className="ov-hero-stats">
          <span><em>開盤</em>{latestPrice?.open ?? '—'}</span>
          <span><em>最高</em><b className="up">{latestPrice?.max ?? '—'}</b></span>
          <span><em>最低</em><b className="down">{latestPrice?.min ?? '—'}</b></span>
          <span><em>成交量</em>{latestPrice ? Math.round(latestPrice.Trading_Volume / 1000).toLocaleString() + ' K股' : '—'}</span>
          <span><em>日期</em>{latestPrice?.date ?? '—'}</span>
        </div>
        <div className="ov-hero-val">
          <div className="hero-val-item">
            <span>本益比 P/E</span>
            <b>{latestPer?.PER?.toFixed(2) ?? '—'}</b>
          </div>
          <div className="hero-val-item">
            <span>股價淨值比 P/B</span>
            <b>{latestPer?.PBR?.toFixed(2) ?? '—'}</b>
          </div>
          <div className="hero-val-item">
            <span>殖利率</span>
            <b>{latestPer?.DividendYield?.toFixed(2) ?? '—'}%</b>
          </div>
        </div>
      </div>

      {/* ═══ 第一排：外資持股 ＋ 月營收 ＋ 財報利潤 ═══ */}
      <div className="ov-row">

        {/* 外資持股 */}
        <div className="ov-card">
          <div className="ov-card-title">外資持股</div>
          <div className="ov-big-num">{shareRatio ?? '—'}<span className="ov-unit">%</span></div>
          <div className="ov-sub">上限 {shareLimit ?? '—'}%</div>
          {shareUsed !== null && (
            <div className="ov-progress-wrap">
              <div className="ov-progress-label">
                <span>已使用上限</span><span className="ov-pct-val">{shareUsed}%</span>
              </div>
              <div className="ov-progress-bg">
                <div
                  className="ov-progress-fill"
                  style={{ width: `${Math.min(parseFloat(shareUsed), 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="ov-sub" style={{ marginTop: '0.5rem' }}>
            資料日期：{latestShare?.date ?? '—'}
          </div>
        </div>

        {/* 月營收 */}
        <div className="ov-card">
          <div className="ov-card-title">月營收</div>
          <div className="ov-big-num">
            {latestRev ? Math.round(latestRev.revenue / 1e8).toLocaleString() : '—'}
            <span className="ov-unit">億</span>
          </div>
          <div className="ov-sub">{latestRev?.date?.slice(0, 7) ?? '—'}</div>
          <div className="ov-badges">
            {revYoY !== null && (
              <span className={`ov-badge ${parseFloat(revYoY) >= 0 ? 'badge-up' : 'badge-down'}`}>
                年增 {sign(parseFloat(revYoY))}{revYoY}%
              </span>
            )}
            {revMoM !== null && (
              <span className={`ov-badge ${parseFloat(revMoM) >= 0 ? 'badge-up' : 'badge-down'}`}>
                月增 {sign(parseFloat(revMoM))}{revMoM}%
              </span>
            )}
          </div>
        </div>

        {/* 財務利潤率 雷達 */}
        <div className="ov-card">
          <div className="ov-card-title">利潤率（最新季）</div>
          <div className="ov-rate-nums">
            <div className="ov-rate-item">
              <span>毛利率</span>
              <b className={grossRate && parseFloat(grossRate) > 0 ? 'up' : ''}>{grossRate ?? '—'}%</b>
            </div>
            <div className="ov-rate-item">
              <span>營益率</span>
              <b className={opRate && parseFloat(opRate) > 0 ? 'up' : ''}>{opRate ?? '—'}%</b>
            </div>
            <div className="ov-rate-item">
              <span>淨利率</span>
              <b className={netRate && parseFloat(netRate) > 0 ? 'up' : ''}>{netRate ?? '—'}%</b>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <RadarChart data={finRadarData} cx="50%" cy="50%" outerRadius={50}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="ov-sub ov-sub-center">
            EPS {latestFin?.EPS?.toFixed(2) ?? '—'} 元　
            {latestFin?.date?.slice(0, 7) ?? ''}
          </div>
        </div>
      </div>

      {/* ═══ 第二排：三大法人 ＋ 融資融券 ＋ 股利 ═══ */}
      <div className="ov-row">

        {/* 三大法人 */}
        <div className="ov-card ov-card-wide">
          <div className="ov-card-title">
            三大法人買賣超（張）
            <span className="ov-card-title-sub">今日 / 近30日累積</span>
          </div>
          <div className="ov-inst-nums">
            {instBarData.map(d => (
              <div key={d.name} className="ov-inst-item">
                <span className="ov-inst-label">{d.name}</span>
                <span className={`ov-inst-today ${d.today >= 0 ? 'up' : 'down'}`}>
                  {sign(d.today)}{d.today.toLocaleString()}
                </span>
                <span className={`ov-inst-cumul ${d.cumul >= 0 ? 'up' : 'down'}`}>
                  累 {sign(d.cumul)}{d.cumul.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={instBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={45} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                formatter={(v) => [v.toLocaleString() + ' 張']}
              />
              <Bar dataKey="cumul" name="累積" radius={[0, 4, 4, 0]}>
                {instBarData.map((d, i) => (
                  <Cell key={i} fill={d.cumul >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
                <LabelList dataKey="cumul" position="right"
                  style={{ fill: '#94a3b8', fontSize: 10 }}
                  formatter={v => v.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 融資融券 */}
        <div className="ov-card">
          <div className="ov-card-title">融資融券（最新）</div>
          <div className="ov-margin-grid">
            <div className="ov-margin-item ov-margin-buy">
              <div className="ov-margin-label">融資餘額</div>
              <div className="ov-margin-val">
                {latestMargin ? Math.round(latestMargin.MarginPurchaseTodayBalance / 1000).toLocaleString() : '—'}
                <span className="ov-unit">千股</span>
              </div>
              <div className={`ov-margin-chg ${marginBalChange >= 0 ? 'up' : 'down'}`}>
                {sign(marginBalChange)}{marginBalChange.toLocaleString()} K
              </div>
            </div>
            <div className="ov-margin-item ov-margin-sell">
              <div className="ov-margin-label">融券餘額</div>
              <div className="ov-margin-val">
                {latestMargin ? Math.round(latestMargin.ShortSaleTodayBalance / 1000).toLocaleString() : '—'}
                <span className="ov-unit">千股</span>
              </div>
              <div className={`ov-margin-chg ${shortBalChange >= 0 ? 'up' : 'down'}`}>
                {sign(shortBalChange)}{shortBalChange.toLocaleString()} K
              </div>
            </div>
          </div>
          {latestMargin && latestMargin.MarginPurchaseTodayBalance && latestMargin.ShortSaleTodayBalance && (
            <>
              <div className="ov-sub" style={{ marginTop: '0.75rem' }}>融資/融券比</div>
              {(() => {
                const total = latestMargin.MarginPurchaseTodayBalance + latestMargin.ShortSaleTodayBalance;
                const buyPct = ((latestMargin.MarginPurchaseTodayBalance / total) * 100).toFixed(1);
                const sellPct = (100 - parseFloat(buyPct)).toFixed(1);
                return (
                  <div className="ov-ratio-bar">
                    <div className="ov-ratio-buy" style={{ width: `${buyPct}%` }}>
                      {buyPct}%
                    </div>
                    <div className="ov-ratio-sell" style={{ width: `${sellPct}%` }}>
                      {sellPct}%
                    </div>
                  </div>
                );
              })()}
              <div className="ov-ratio-legend">
                <span className="dot-buy" />融資　<span className="dot-sell" />融券
              </div>
            </>
          )}
          <div className="ov-sub" style={{ marginTop: '0.5rem' }}>
            資料日期：{latestMargin?.date ?? '—'}
          </div>
        </div>

        {/* 股利 */}
        <div className="ov-card">
          <div className="ov-card-title">股利（近期）</div>
          {latestDiv ? (
            <>
              <div className="ov-div-year">{latestDiv.date?.slice(0, 4)} 年度</div>
              <div className="ov-div-grid">
                <div className="ov-div-item">
                  <span>現金股利</span>
                  <b className="up">{(latestDiv.CashEarningsDistribution + (latestDiv.CashStatutoryReserveDistribution || 0))?.toFixed(2) ?? '—'}</b>
                  <span className="ov-unit">元</span>
                </div>
                <div className="ov-div-item">
                  <span>股票股利</span>
                  <b>{(latestDiv.StockEarningsDistribution + (latestDiv.StockStatutoryReserveDistribution || 0))?.toFixed(2) ?? '—'}</b>
                  <span className="ov-unit">元</span>
                </div>
                <div className="ov-div-item">
                  <span>合計</span>
                  <b className="highlight">
                    {(
                      (latestDiv.CashEarningsDistribution || 0) +
                      (latestDiv.CashStatutoryReserveDistribution || 0) +
                      (latestDiv.StockEarningsDistribution || 0) +
                      (latestDiv.StockStatutoryReserveDistribution || 0)
                    ).toFixed(2)}
                  </b>
                  <span className="ov-unit">元</span>
                </div>
              </div>
              <div className="ov-div-history">
                <div className="ov-card-title" style={{ fontSize: '0.75rem', marginTop: '0.75rem' }}>近5年現金股利</div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart
                    data={divRaw.slice(-5).map(r => ({
                      year: r.date?.slice(0, 4),
                      cash: parseFloat(
                        ((r.CashEarningsDistribution || 0) + (r.CashStatutoryReserveDistribution || 0)).toFixed(2)
                      ),
                    }))}
                    margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                      formatter={(v) => [v + ' 元', '現金股利']}
                    />
                    <Bar dataKey="cash" name="現金股利" fill="#f59e0b" radius={[3, 3, 0, 0]}>
                      <LabelList dataKey="cash" position="top" style={{ fill: '#94a3b8', fontSize: 9 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="ov-sub" style={{ marginTop: '1rem' }}>無股利資料</div>
          )}
        </div>

      </div>
    </div>
  );
}
