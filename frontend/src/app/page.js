"use client";

import {
  Activity, AlertTriangle, BarChart3, Bell, Box, ChevronDown, ChevronRight,
  Clock3, Cpu, Database, FileText, Gauge, HardDrive, LayoutDashboard, Menu,
  MoreHorizontal, Network, Search, Server, Settings, ShieldCheck, Ticket,
  Thermometer, UserRound, X, Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const initialNodes = [
  { id: 1, code: "SV-01", name: "NODE-HCM-01", rack: "Rack A01", ip: "10.10.1.11", cpu: 34, ram: 62, temp: 42, disk: 58, power: 380, status: "healthy" },
  { id: 2, code: "SV-02", name: "NODE-HCM-02", rack: "Rack A01", ip: "10.10.1.12", cpu: 94, ram: 78, temp: 71, disk: 62, power: 512, status: "critical" },
  { id: 3, code: "SV-03", name: "NODE-HCM-03", rack: "Rack A02", ip: "10.10.1.13", cpu: 46, ram: 51, temp: 45, disk: 66, power: 404, status: "healthy" },
  { id: 4, code: "SV-04", name: "NODE-HCM-04", rack: "Rack A02", ip: "10.10.1.14", cpu: 0, ram: 0, temp: 0, disk: 0, power: 0, status: "offline" },
];

const alertsSeed = [
  { id: 1, code: "ALT-2048", severity: "Critical", source: "NODE-HCM-02", message: "CPU vượt ngưỡng 90% trong 2 phút", time: "2 phút trước", state: "Chưa xử lý" },
  { id: 2, code: "ALT-2047", severity: "Critical", source: "NODE-HCM-04", message: "Mất heartbeat quá 90 giây", time: "8 phút trước", state: "Đã xác nhận" },
  { id: 3, code: "ALT-2046", severity: "Warning", source: "Rack A02", message: "Nhiệt độ đầu vào tăng bất thường", time: "24 phút trước", state: "Đã xác nhận" },
];

const nav = [
  ["Tổng quan", LayoutDashboard], ["Digital Twin", Box], ["Telemetry", Activity],
  ["Cảnh báo", Bell, 3], ["Tickets", Ticket, 4], ["Báo cáo PUE", BarChart3],
];

function Sparkline({ values, color = "#2795e8" }) {
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${42 - v * .34}`).join(" ");
  return <svg className="spark" viewBox="0 0 100 44" preserveAspectRatio="none"><defs><linearGradient id={`g${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity=".3"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={`0,44 ${points} 100,44`} fill={`url(#g${color.slice(1)})`}/><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>;
}

function Metric({ icon: Icon, label, value, unit, tone, values }) {
  return <div className="metric card"><div className={`metric-icon ${tone}`}><Icon size={19}/></div><div><span>{label}</span><strong>{value}<small>{unit}</small></strong></div><Sparkline values={values} color={tone === "red" ? "#ef5c68" : tone === "amber" ? "#efa83f" : "#2795e8"}/></div>;
}

function Tree({ selected, setSelected, nodes }) {
  const [open, setOpen] = useState({ site: true, room: true, "Rack A01": true, "Rack A02": true });
  const toggle = (key) => setOpen(state => ({ ...state, [key]: !state[key] }));
  const Arrow = ({ id }) => open[id] ? <ChevronDown/> : <ChevronRight/>;

  return <div className="tree">
    <button className="tree-row level-0 tree-toggle" onClick={() => toggle("site")}><Arrow id="site"/><Database/><span>DC Hồ Chí Minh</span><b className="ok-dot"/></button>
    {open.site && <button className="tree-row level-1 tree-toggle" onClick={() => toggle("room")}><Arrow id="room"/><Box/><span>Phòng máy 01</span></button>}
    {open.site && open.room && ["Rack A01", "Rack A02"].map(rack => <div key={rack}>
      <button className="tree-row level-2 tree-toggle" onClick={() => toggle(rack)}><Arrow id={rack}/><Server/><span>{rack}</span></button>
      {open[rack] && nodes.filter(n => n.rack === rack).map(n => <button key={n.id} className={`tree-row level-3 ${selected.id === n.id ? "selected" : ""}`} onClick={() => setSelected(n)}><ChevronRight/><Cpu/><span>{n.name}</span><i className={`status-dot ${n.status}`}/></button>)}
    </div>)}
  </div>;
}

function AlertTable({ alerts, acknowledge, createFromAlert, full = false }) {
  return <div className="table-wrap"><table><thead><tr><th>MỨC ĐỘ</th><th>NGUỒN</th><th>NỘI DUNG</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th><th/></tr></thead><tbody>{alerts.map(a => <tr key={a.id}><td><span className={`severity ${a.severity.toLowerCase()}`}><i/>{a.severity}</span></td><td><b>{a.source}</b><small>{a.code || a.id}</small></td><td>{a.message}</td><td><Clock3/>{a.time || "Vừa cập nhật"}</td><td><span className="state">{a.state}</span></td><td><div className="row-actions">{a.state === "Chưa xử lý" && <button className="ack" onClick={() => acknowledge(a.id)}>Xác nhận</button>}{full && <button className="ack" onClick={() => createFromAlert(a)}>Tạo ticket</button>}</div></td></tr>)}</tbody></table></div>;
}

function WorkspaceView({ active, nodes, selected, setSelected, alerts, tickets, report, auditLogs, history, acknowledge, createFromAlert, updateTicket }) {
  if (active === "Digital Twin") return <section className="detail-layout"><div className="card detail-tree"><div className="card-title"><div><h2>Cây hạ tầng</h2><span>Site → Room → Rack → Node</span></div></div><Tree selected={selected} setSelected={setSelected} nodes={nodes}/></div><div className="node-grid">{nodes.map(n => <button key={n.id} className={`node-card card ${selected.id === n.id ? "chosen" : ""}`} onClick={() => setSelected(n)}><div className={`server-symbol ${n.status}`}><Server/></div><div><b>{n.name}</b><span>{n.ip} · {n.rack}</span></div><i className={`status-dot ${n.status}`}/><dl><div><dt>CPU</dt><dd>{n.cpu}%</dd></div><div><dt>RAM</dt><dd>{n.ram}%</dd></div><div><dt>Nhiệt độ</dt><dd>{n.temp}°C</dd></div><div><dt>Công suất</dt><dd>{n.power}W</dd></div></dl></button>)}</div></section>;

  if (active === "Telemetry") return <section className="card full-panel"><div className="card-title"><div><h2>Telemetry trực tiếp</h2><span>Dữ liệu mới được đồng bộ từ Collector mỗi 5 giây</span></div><select value={selected.id} onChange={e => setSelected(nodes.find(n => n.id === Number(e.target.value)))}>{nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select></div><div className="telemetry-focus"><div className="selected-summary"><div className={`server-symbol ${selected.status}`}><Server/></div><div><b>{selected.name}</b><span>{selected.ip} · {selected.rack}</span></div><div className={`status-pill ${selected.status}`}>{selected.status === "healthy" ? "Healthy" : selected.status === "critical" ? "Critical" : "Unavailable"}</div></div><div className="big-chart"><div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><span/><span/><span/><span/><span/><Sparkline values={history} color="#2795e8"/></div></div><div className="telemetry-cards"><Metric icon={Cpu} label="CPU" value={selected.cpu} unit="%" tone="blue" values={history}/><Metric icon={Database} label="Memory" value={selected.ram} unit="%" tone="blue" values={history.map(v => Math.max(1,v-12))}/><Metric icon={Thermometer} label="Nhiệt độ" value={selected.temp} unit="°C" tone="red" values={history.map(v => v*.7)}/><Metric icon={HardDrive} label="Disk" value={selected.disk || 0} unit="%" tone="amber" values={history.map(v => v*.8)}/></div></div></section>;

  if (active === "Cảnh báo") return <section className="card full-panel"><div className="card-title"><div><h2>Quản lý cảnh báo</h2><span>{alerts.filter(a => a.state === "Chưa xử lý").length} cảnh báo cần xác nhận</span></div><div className="filter-pills"><button className="selected">Tất cả</button><button>Critical</button><button>Warning</button></div></div><AlertTable alerts={alerts} acknowledge={acknowledge} createFromAlert={createFromAlert} full/></section>;

  if (active === "Tickets") return <section className="tickets-board">{["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(status => <div className="ticket-column" key={status}><div className="column-head"><b>{{OPEN:"Mới",IN_PROGRESS:"Đang xử lý",RESOLVED:"Chờ duyệt",CLOSED:"Đã đóng"}[status]}</b><span>{tickets.filter(t => t.status === status).length}</span></div>{tickets.filter(t => t.status === status).map(t => <article className="ticket-card card" key={t.id}><div><span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span><small>{t.code}</small></div><h3>{t.title}</h3><p>{t.description}</p><div className="ticket-meta"><Server/>{t.node}</div><div className="ticket-meta"><UserRound/>{t.assignee}</div><select value={t.status} onChange={e => updateTicket(t.id, {status:e.target.value})}><option value="OPEN">Mới</option><option value="IN_PROGRESS">Đang xử lý</option><option value="RESOLVED">Chờ duyệt</option><option value="CLOSED">Đã đóng</option></select></article>)}</div>)}</section>;

  if (active === "Báo cáo PUE") return <section className="report-grid"><div className="card report-main"><div className="card-title"><div><h2>Chỉ số PUE trong ngày</h2><span>Mục tiêu vận hành ≤ {report?.target || 1.5}</span></div></div><div className="report-chart"><div className="report-bars">{(report?.points || []).map((p,i) => <div key={p.hour} title={`${p.hour}: ${p.pue}`}><i style={{height:`${Math.max(20,(p.pue-1)*135)}px`}}/><span>{i%2===0?p.hour:""}</span></div>)}</div></div></div><div className="card report-summary"><div className="gauge"><svg viewBox="0 0 200 115"><path d="M25 100 A75 75 0 0 1 175 100"/><path className="gauge-fill" d="M25 100 A75 75 0 0 1 175 100"/></svg><div><strong>{report?.current || 1.42}</strong><span>Tốt</span></div></div><div className="report-kpis"><div><span>PUE trung bình</span><b>{report?.average || 1.41}</b></div><div><span>Tổng điện năng</span><b>{report?.summary?.totalEnergyKwh || 297.6} kWh</b></div><div><span>Thiết bị IT</span><b>{report?.summary?.itEnergyKwh || 209.6} kWh</b></div><div><span>Làm mát</span><b>{report?.summary?.coolingEnergyKwh || 88} kWh</b></div></div></div></section>;

  if (active === "Nhật ký hệ thống") return <section className="card full-panel audit-panel"><div className="card-title"><div><h2>Nhật ký hệ thống</h2><span>Dữ liệu audit log ghi từ backend và database</span></div><div className="filter-pills"><button className="selected">Tất cả</button><button>Alert</button><button>Ticket</button><button>System</button></div></div><div className="table-wrap"><table><thead><tr><th>THỜI GIAN</th><th>NGƯỜI DÙNG</th><th>HÀNH ĐỘNG</th><th>ĐỐI TƯỢNG</th><th>IP</th><th>CHI TIẾT</th></tr></thead><tbody>{auditLogs.map(log => <tr key={log.id}><td><Clock3/>{log.timestamp ? new Date(log.timestamp).toLocaleString("vi-VN") : "N/A"}</td><td><b>{log.username || "system"}</b><small>audit #{log.id}</small></td><td><span className="state">{log.action}</span></td><td><b>{log.entity}</b><small>{log.targetId}</small></td><td>{log.ip || "N/A"}</td><td>{Object.keys(log.details || {}).length ? JSON.stringify(log.details) : "Không có"}</td></tr>)}</tbody></table></div></section>;
  return null;
}

export default function Dashboard() {
  const [active, setActive] = useState("Tổng quan");
  const [nodes, setNodes] = useState(initialNodes);
  const [selected, setSelected] = useState(initialNodes[1]);
  const [alerts, setAlerts] = useState(alertsSeed);
  const [tickets, setTickets] = useState([]);
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [summary, setSummary] = useState({activeNodes: 3, totalNodes: 4, avgCpu: 58, maxTemp: 71, pue: 1.42});
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const loadData = async (quiet = false) => {
    try {
      const [dashboard, ticketData, pueData, auditData] = await Promise.all([api.dashboard(), api.tickets(), api.pue(), api.auditLogs()]);
      setNodes(dashboard.nodes); setSummary(dashboard.summary); setAlerts(dashboard.alerts);
      setTickets(ticketData); setReport(pueData); setAuditLogs(auditData); setConnected(true); setTick(t => t + 1);
    } catch (error) {
      setConnected(false);
      if (!quiet) setToast("Không kết nối được backend · đang dùng dữ liệu dự phòng");
    }
  };
  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(true), 5000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { const fresh = nodes.find(n => n.id === selected.id); if (fresh) setSelected(fresh); }, [nodes]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);

  const history = useMemo(() => Array.from({length: 16}, (_, i) => Math.max(12, Math.min(98, selected.cpu + Math.round(Math.sin((i + tick) / 2) * 9) + Math.round(Math.random() * 7)))), [selected.id, selected.cpu, tick]);
  const acknowledge = async id => {
    try { const updated = await api.acknowledge(id); setAlerts(a => a.map(x => x.id === id ? updated : x)); setToast(`Đã xác nhận ${updated.code}`); }
    catch { setToast("Không thể xác nhận cảnh báo"); }
  };
  const createFromAlert = async alert => {
    try { const item = await api.createTicket({node_id: alert.nodeId || 1, alert_id: alert.id, title: `Xử lý: ${alert.message}`, description: `Cảnh báo từ ${alert.source}`, priority: alert.severity === "Critical" ? "URGENT" : "MEDIUM", assigned_to_user_id: 2}); setTickets(t => [item, ...t]); setToast(`Đã tạo ${item.code}`); }
    catch { setToast("Không thể tạo ticket"); }
  };
  const updateTicket = async (id, changes) => {
    try { const item = await api.updateTicket(id, changes); setTickets(t => t.map(x => x.id === id ? item : x)); setToast(`Đã cập nhật ${item.code}`); }
    catch { setToast("Không thể cập nhật ticket"); }
  };

  return <div className="app-shell">
    <aside className={menuOpen ? "open" : ""}>
      <div className="brand"><div className="brand-mark"><Activity/></div><div><strong>AR-IMMS</strong><span>COMMAND CENTER</span></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><X/></button></div>
      <div className="workspace"><span>KHÔNG GIAN LÀM VIỆC</span><div><div className="avatar square">DC</div><p><b>HCM Data Center</b><small>Production</small></p><ChevronDown/></div></div>
      <nav>{nav.map(([label, Icon, badge]) => <button key={label} onClick={() => { setActive(label); setMenuOpen(false); }} className={active === label ? "active" : ""}><Icon/><span>{label}</span>{badge && <em>{badge}</em>}</button>)}</nav>
      <div className="aside-bottom"><button className={active === "Nhật ký hệ thống" ? "active" : ""} onClick={() => { setActive("Nhật ký hệ thống"); setMenuOpen(false); }}><ShieldCheck/>Nhật ký hệ thống</button><button disabled title="Chưa có API cài đặt trong backend"><Settings/>Cài đặt</button><div className="support"><Zap/><div><b>Hệ thống ổn định</b><span>Uptime 99.98%</span></div></div></div>
    </aside>
    <main>
      <header><button className="menu-btn" onClick={() => setMenuOpen(true)}><Menu/></button><div className="search"><Search/><input aria-label="Tìm kiếm" placeholder="Tìm server, ticket, cảnh báo..."/><kbd>⌘ K</kbd></div><div className="header-actions"><div className={`live ${connected ? "" : "disconnected"}`}><i/>{connected ? "Backend trực tuyến" : "Dữ liệu dự phòng"}</div><button className="icon-button"><Bell/><b>{summary.openAlerts || 0}</b></button><div className="user"><div className="avatar">NH</div><p><b>Nguyễn Hữu Minh</b><span>Operator</span></p><ChevronDown/></div></div></header>
      <div className="content">
        <div className="page-head"><div><p>COMMAND CENTER / {active.toUpperCase()}</p><h1>{active === "Tổng quan" ? "Tổng quan vận hành" : active}</h1><span>Cập nhật tự động mỗi 5 giây · {summary.totalNodes || nodes.length} nodes đang giám sát</span></div><div className="page-actions"><button onClick={() => window.print()}><FileText/>Xuất báo cáo</button><button className="primary" onClick={() => loadData()}><Activity/>Đồng bộ ngay</button></div></div>

        {active !== "Tổng quan" ? <WorkspaceView active={active} nodes={nodes} selected={selected} setSelected={setSelected} alerts={alerts} tickets={tickets} report={report} auditLogs={auditLogs} history={history} acknowledge={acknowledge} createFromAlert={createFromAlert} updateTicket={updateTicket}/> : <>

        <section className="metrics-grid">
          <Metric icon={Server} label="Nodes hoạt động" value={`${summary.activeNodes}/${summary.totalNodes}`} unit="" tone="purple" values={[56,61,58,72,75,74,78,76]}/>
          <Metric icon={Cpu} label="CPU trung bình" value={summary.avgCpu} unit="%" tone="blue" values={[45,48,50,47,55,59,56,58]}/>
          <Metric icon={Thermometer} label="Nhiệt độ cao nhất" value={summary.maxTemp} unit="°C" tone="red" values={[52,55,54,60,58,65,68,71]}/>
          <Metric icon={Gauge} label="PUE hiện tại" value={summary.pue} unit="" tone="amber" values={[44,43,45,42,41,43,42,42]}/>
        </section>

        <section className="dashboard-grid">
          <div className="card twin-panel"><div className="card-title"><div><h2>Digital Twin</h2><span>Cấu trúc hạ tầng thời gian thực</span></div><button><MoreHorizontal/></button></div><Tree selected={selected} setSelected={setSelected} nodes={nodes}/><div className="legend"><span><i className="status-dot healthy"/>Hoạt động</span><span><i className="status-dot critical"/>Cảnh báo</span><span><i className="status-dot offline"/>Mất kết nối</span></div></div>
          <div className="card telemetry-panel"><div className="card-title"><div><h2>Telemetry thời gian thực</h2><span>{selected.name} · {selected.ip}</span></div><select aria-label="Khoảng thời gian"><option>15 phút</option><option>1 giờ</option><option>24 giờ</option></select></div>
            <div className="selected-summary"><div className={`server-symbol ${selected.status}`}><Server/></div><div><b>{selected.name}</b><span>{selected.rack} · Ubuntu Server 22.04</span></div><div className={`status-pill ${selected.status}`}>{selected.status === "healthy" ? "Healthy" : selected.status === "critical" ? "Critical" : "Unavailable"}</div></div>
            <div className="chart"><div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><span/><span/><span/><span/><span/><Sparkline values={history} color="#2795e8"/><div className="chart-x"><b>14:20</b><b>14:25</b><b>14:30</b><b>Bây giờ</b></div></div></div>
            <div className="telemetry-stats"><div><Cpu/><span>CPU</span><strong>{selected.cpu}%</strong></div><div><Database/><span>Memory</span><strong>{selected.ram}%</strong></div><div><Thermometer/><span>Nhiệt độ</span><strong>{selected.temp}°C</strong></div><div><Zap/><span>Công suất</span><strong>{selected.power}W</strong></div></div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="card alerts"><div className="card-title"><div><h2>Cảnh báo gần đây</h2><span>{alerts.filter(a => a.state === "Chưa xử lý").length} cảnh báo cần xử lý</span></div><button className="text-button" onClick={() => setActive("Cảnh báo")}>Xem tất cả <ChevronRight/></button></div>
            <AlertTable alerts={alerts} acknowledge={acknowledge} createFromAlert={createFromAlert}/>
          </div>
          <div className="card pue"><div className="card-title"><div><h2>Hiệu suất năng lượng</h2><span>PUE trong ngày</span></div><button><MoreHorizontal/></button></div><div className="gauge"><svg viewBox="0 0 200 115"><path d="M25 100 A75 75 0 0 1 175 100"/><path className="gauge-fill" d="M25 100 A75 75 0 0 1 175 100"/></svg><div><strong>{summary.pue}</strong><span>Tốt</span></div></div><div className="pue-row"><div><span>Tổng điện năng</span><b>{report?.summary?.totalEnergyKwh || 297.6} kWh</b></div><div><span>Thiết bị IT</span><b>{report?.summary?.itEnergyKwh || 209.6} kWh</b></div></div><div className="pue-note"><span>↓ 4.1%</span> so với hôm qua</div></div>
        </section>
        </>}
      </div>
    </main>
    {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)}/>}
    {toast && <div className="toast"><ShieldCheck/>{toast}</div>}
  </div>;
}
