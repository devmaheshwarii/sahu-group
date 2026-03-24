import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';

function formatCurrency(val) {
  if (val >= 10000000) return '₹' + (val / 10000000).toFixed(2) + ' Cr';
  if (val >= 100000) return '₹' + (val / 100000).toFixed(2) + ' L';
  return '₹' + val.toLocaleString('en-IN');
}

function KPICard({ title, value, subtitle, icon, color, trend }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '24px 28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      minWidth: 0,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      borderLeft: `4px solid ${color}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'; }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 4, lineHeight: 1.1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: 13, color: trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#6b7280', marginTop: 6, fontWeight: 500 }}>
          {trend === 'up' && '▲ '}{trend === 'down' && '▼ '}{subtitle}
        </div>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, span }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      gridColumn: span ? `span ${span}` : undefined,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 20, margin: 0, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>{title}</h3>
      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const chartRefs = {
    model: useRef(null),
    location: useRef(null),
    status: useRef(null),
    aging: useRef(null),
    color: useRef(null),
    trend: useRef(null),
    payment: useRef(null),
    variant: useRef(null),
  };
  const chartInstances = useRef({});

  useEffect(() => {
    fetch('/data/dashboard.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;
    const loadCharts = () => {
      if (typeof window.Chart === 'undefined') {
        setTimeout(loadCharts, 200);
        return;
      }
      const Chart = window.Chart;
      Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
      Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.legend.labels.padding = 16;

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#a855f7', '#22c55e', '#eab308'];

      // Destroy existing
      Object.values(chartInstances.current).forEach(c => c && c.destroy());

      // Model distribution - Horizontal bar
      const modelLabels = Object.keys(data.charts.modelDistribution);
      const modelValues = Object.values(data.charts.modelDistribution);
      if (chartRefs.model.current) {
        chartInstances.current.model = new Chart(chartRefs.model.current, {
          type: 'bar',
          data: { labels: modelLabels, datasets: [{ data: modelValues, backgroundColor: colors.slice(0, modelLabels.length), borderRadius: 6, borderSkipped: false }] },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 12 } } }, y: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } } } }
        });
      }

      // Location distribution - Doughnut
      if (chartRefs.location.current) {
        chartInstances.current.location = new Chart(chartRefs.location.current, {
          type: 'doughnut',
          data: { labels: Object.keys(data.charts.locationDistribution), datasets: [{ data: Object.values(data.charts.locationDistribution), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'], borderWidth: 0, spacing: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 12 }, padding: 12 } } } }
        });
      }

      // Status breakdown - Doughnut
      if (chartRefs.status.current) {
        const statusColors = { 'FRESH STK': '#10b981', 'P.MDDP': '#f59e0b', 'WIP STK': '#3b82f6' };
        chartInstances.current.status = new Chart(chartRefs.status.current, {
          type: 'doughnut',
          data: { labels: Object.keys(data.charts.statusBreakdown), datasets: [{ data: Object.values(data.charts.statusBreakdown), backgroundColor: Object.keys(data.charts.statusBreakdown).map(k => statusColors[k] || '#9ca3af'), borderWidth: 0, spacing: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 12 }, padding: 12 } } } }
        });
      }

      // Aging analysis - Bar
      if (chartRefs.aging.current) {
        const agingColors = { '0-5 days': '#10b981', '6-10 days': '#f59e0b', '11-20 days': '#f97316', '21+ days': '#ef4444', 'Negative': '#6366f1' };
        chartInstances.current.aging = new Chart(chartRefs.aging.current, {
          type: 'bar',
          data: { labels: Object.keys(data.charts.agingAnalysis), datasets: [{ data: Object.values(data.charts.agingAnalysis), backgroundColor: Object.keys(data.charts.agingAnalysis).map(k => agingColors[k]), borderRadius: 6, borderSkipped: false }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f3f4f6' }, beginAtZero: true } } }
        });
      }

      // Color preference - Horizontal bar
      if (chartRefs.color.current) {
        const colorLabels = Object.keys(data.charts.colorDistribution);
        chartInstances.current.color = new Chart(chartRefs.color.current, {
          type: 'bar',
          data: { labels: colorLabels, datasets: [{ data: Object.values(data.charts.colorDistribution), backgroundColor: '#6366f1', borderRadius: 6, borderSkipped: false }] },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
        });
      }

      // Allotment trend - Line
      if (chartRefs.trend.current && data.charts.allotmentTrend.length) {
        chartInstances.current.trend = new Chart(chartRefs.trend.current, {
          type: 'line',
          data: { labels: data.charts.allotmentTrend.map(d => { const dt = new Date(d.date); return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }), datasets: [{ label: 'Allotments', data: data.charts.allotmentTrend.map(d => d.count), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#3b82f6', pointBorderColor: '#fff', pointBorderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }, y: { grid: { color: '#f3f4f6' }, beginAtZero: true } } }
        });
      }

      // Payment status - Doughnut
      if (chartRefs.payment.current) {
        chartInstances.current.payment = new Chart(chartRefs.payment.current, {
          type: 'doughnut',
          data: { labels: Object.keys(data.charts.paymentStatus), datasets: [{ data: Object.values(data.charts.paymentStatus), backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'], borderWidth: 0, spacing: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 11 }, padding: 10 } } } }
        });
      }

      // Variant distribution - Bar
      if (chartRefs.variant.current) {
        const varLabels = Object.keys(data.charts.variantDistribution);
        chartInstances.current.variant = new Chart(chartRefs.variant.current, {
          type: 'bar',
          data: { labels: varLabels.map(l => l.length > 20 ? l.slice(0, 20) + '...' : l), datasets: [{ data: Object.values(data.charts.variantDistribution), backgroundColor: colors.slice(0, varLabels.length), borderRadius: 6, borderSkipped: false }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 9 } } }, y: { grid: { color: '#f3f4f6' }, beginAtZero: true } } }
        });
      }
    };
    loadCharts();
    return () => { Object.values(chartInstances.current).forEach(c => c && c.destroy()); };
  }, [data]);

  if (!data) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p style={{ marginTop: 16, color: '#6b7280', fontSize: 15 }}>Loading dashboard...</p>
      </div>
    </div>
  );

  const { kpis, charts, tableData } = data;

  // Filtered table
  const filtered = tableData.filter(r => {
    const matchSearch = !search || r.customer.toLowerCase().includes(search.toLowerCase()) || r.model.toLowerCase().includes(search.toLowerCase()) || r.outlet.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchModel = modelFilter === 'All' || r.model === modelFilter;
    return matchSearch && matchStatus && matchModel;
  });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const models = [...new Set(tableData.map(r => r.model))].sort();

  return (
    <>
      <Head>
        <title>Sahu Group - Stock Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/Sahu_Logo2.svg" />
        <link rel="apple-touch-icon" href="/Sahu_Logo2.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
      </Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f1f5f9; color: #1e293b; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        @media (max-width: 1200px) { .grid-3 { grid-template-columns: 1fr 1fr; } .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { background: #f8fafc; color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 14px; text-align: left; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 1; }
        td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:hover td { background: #f8fafc; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        input, select { font-family: inherit; }
      `}</style>

      <div style={{ minHeight: '100vh', padding: '0 0 40px' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', padding: '20px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 5, boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)' }}>
                <img src="/Sahu_Logo2.svg" alt="Sahu Group logo" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Sahu Group</h1>
                <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Vehicle Stock Analytics Dashboard</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, fontSize: 13, color: '#cbd5e1' }}>
                Data as on: <strong style={{ color: '#fff' }}>17 Feb 2026</strong>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          {/* KPI Cards */}
          <div className="kpi-grid" style={{ marginBottom: 24, animation: 'fadeIn 0.5s ease-out' }}>
            <KPICard title="Total Stock" value={kpis.totalStock.toLocaleString()} subtitle={`${kpis.freshStock} Fresh, ${kpis.wipStock} WIP`} icon="🚗" color="#3b82f6" />
            <KPICard title="Allocated" value={kpis.allocatedVehicles.toLocaleString()} subtitle={`${kpis.allocationRate}% allocation rate`} icon="✅" color="#10b981" trend="up" />
            <KPICard title="Unallocated" value={kpis.unallocatedVehicles.toLocaleString()} subtitle="Available for booking" icon="📋" color="#f59e0b" />
            <KPICard title="Payment Received" value={formatCurrency(kpis.totalPaymentReceived)} subtitle={`Avg ${formatCurrency(kpis.avgPayment)} per vehicle`} icon="💰" color="#8b5cf6" />
            <KPICard title="Pending MDDP" value={kpis.pendingMddp.toLocaleString()} subtitle={`${((kpis.pendingMddp / kpis.totalStock) * 100).toFixed(1)}% of total stock`} icon="⏳" color="#ef4444" trend="down" />
          </div>

          {/* Row 1: Model + Location */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <ChartCard title="Stock by Model">
              <div style={{ height: 380 }}><canvas ref={chartRefs.model}></canvas></div>
            </ChartCard>
            <ChartCard title="Stock by Location">
              <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><canvas ref={chartRefs.location}></canvas></div>
            </ChartCard>
          </div>

          {/* Row 2: Status + Aging + Payment */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <ChartCard title="Vehicle Status">
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><canvas ref={chartRefs.status}></canvas></div>
            </ChartCard>
            <ChartCard title="Aging Analysis">
              <div style={{ height: 260 }}><canvas ref={chartRefs.aging}></canvas></div>
            </ChartCard>
            <ChartCard title="Payment Collection">
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><canvas ref={chartRefs.payment}></canvas></div>
            </ChartCard>
          </div>

          {/* Row 3: Allotment Trend + Color + Variant */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <ChartCard title="Allotment Trend (Daily)" span={1}>
              <div style={{ height: 260 }}><canvas ref={chartRefs.trend}></canvas></div>
            </ChartCard>
            <ChartCard title="Top Color Preferences">
              <div style={{ height: 260 }}><canvas ref={chartRefs.color}></canvas></div>
            </ChartCard>
            <ChartCard title="Top Variants">
              <div style={{ height: 260 }}><canvas ref={chartRefs.variant}></canvas></div>
            </ChartCard>
          </div>

          {/* Data Table */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Allocated Vehicles ({filtered.length})</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text" placeholder="Search customer, model, outlet..."
                  value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 240, outline: 'none' }}
                />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                  <option value="All">All Status</option>
                  <option value="FRESH STK">Fresh Stock</option>
                  <option value="P.MDDP">P.MDDP</option>
                  <option value="WIP STK">WIP Stock</option>
                </select>
                <select value={modelFilter} onChange={e => { setModelFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                  <option value="All">All Models</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 520 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Model</th>
                    <th>Variant</th>
                    <th>Colour</th>
                    <th>Location</th>
                    <th>Outlet</th>
                    <th>Status</th>
                    <th>Aging</th>
                    <th>Payment</th>
                    <th>Payment %</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: '#94a3b8', fontSize: 12 }}>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td style={{ fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customer}</td>
                      <td><span className="badge badge-blue">{r.model}</span></td>
                      <td style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.variant}</td>
                      <td style={{ fontSize: 12 }}>{r.colour}</td>
                      <td>{r.location}</td>
                      <td>{r.outlet || '-'}</td>
                      <td><span className={`badge ${r.status === 'FRESH STK' ? 'badge-green' : r.status === 'WIP STK' ? 'badge-blue' : 'badge-yellow'}`}>{r.status}</span></td>
                      <td style={{ color: r.agingDays > 10 ? '#ef4444' : r.agingDays > 5 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{r.agingDays}d</td>
                      <td>{r.payment > 0 ? formatCurrency(r.payment) : '-'}</td>
                      <td><span className={`badge ${r.paymentPct === 'FULL PAYMENT' ? 'badge-green' : r.paymentPct === 'More than 75%' ? 'badge-blue' : r.paymentPct === 'Less than 75%' ? 'badge-yellow' : 'badge-red'}`}>{r.paymentPct}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                <span>Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>← Prev</button>
                  <span style={{ padding: '6px 12px', display: 'flex', alignItems: 'center' }}>Page {currentPage}/{totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Next →</button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 32, color: '#94a3b8', fontSize: 12 }}>
            <p>Sahu Group Vehicle Stock Analytics • Data as on 17 Feb 2026 • {data.metadata.totalRecords.toLocaleString()} records</p>
          </div>
        </main>
      </div>
    </>
  );
}
