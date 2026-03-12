import './DateRangePicker.css';

const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);

const PRESETS = [
  { label: '1個月', months: 1 },
  { label: '3個月', months: 3 },
  { label: '6個月', months: 6 },
  { label: '1年', months: 12 },
  { label: '3年', months: 36 },
  { label: '5年', months: 60 },
];

function calcStart(months) {
  return fmt(new Date(today.getFullYear(), today.getMonth() - months, today.getDate()));
}

export default function DateRangePicker({ dateRange, onChange }) {
  const { startDate, endDate, preset } = dateRange;

  function applyPreset(months, label) {
    onChange({ startDate: calcStart(months), endDate: fmt(today), preset: label });
  }

  function handleCustomStart(e) {
    onChange({ startDate: e.target.value, endDate, preset: 'custom' });
  }

  function handleCustomEnd(e) {
    onChange({ startDate, endDate: e.target.value, preset: 'custom' });
  }

  return (
    <div className="drp-wrapper">
      <div className="drp-presets">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className={`drp-btn ${preset === p.label ? 'active' : ''}`}
            onClick={() => applyPreset(p.months, p.label)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="drp-custom">
        <span className="drp-label">自訂</span>
        <input
          type="date"
          className="drp-input"
          value={startDate}
          max={endDate}
          onChange={handleCustomStart}
        />
        <span className="drp-sep">～</span>
        <input
          type="date"
          className="drp-input"
          value={endDate}
          min={startDate}
          max={fmt(today)}
          onChange={handleCustomEnd}
        />
      </div>
    </div>
  );
}
