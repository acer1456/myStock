const BASE_URL = "https://api.finmindtrade.com/api/v4/data";

export const fmt = (d) => d.toISOString().slice(0, 10);
export const today = fmt(new Date());

async function fetchData(params) {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 200) throw new Error(json.msg || "API error");
  return json.data || [];
}

export async function fetchStockInfo() {
  return fetchData({ dataset: "TaiwanStockInfo" });
}

export async function fetchStockPrice(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockPrice", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchStockPER(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockPER", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchInstitutional(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockInstitutionalInvestorsBuySell", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchMarginPurchase(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockMarginPurchaseShortSale", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchShareholding(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockShareholding", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchMonthRevenue(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockMonthRevenue", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchDividend(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockDividend", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchDividendResult(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockDividendResult", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchFinancialStatements(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockFinancialStatements", data_id: stockId, start_date: startDate, end_date: endDate });
}

export async function fetchNews(stockId, startDate) {
  return fetchData({ dataset: "TaiwanStockNews", data_id: stockId, start_date: startDate });
}

export async function fetchPriceLimit(stockId, startDate, endDate) {
  return fetchData({ dataset: "TaiwanStockPriceLimit", data_id: stockId, start_date: startDate, end_date: endDate });
}
