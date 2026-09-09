"use client";

import {
  Activity, AlertTriangle, BarChart3, Bell, Box, ChevronDown, ChevronRight,
  Clock3, Cpu, Database, FileText, Gauge, HardDrive, LayoutDashboard, LogOut,
  Menu, MoreHorizontal, Network, Search, Server, Settings, ShieldCheck, Ticket,
  Thermometer, UserRound, X, Zap
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { api, tokenStorage } from "../lib/api";
import LoginPage from "./login";

// ΓöÇΓöÇΓöÇ Seed data (d├╣ng khi backend ch╞░a kß║┐t nß╗æi) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const initialNodes = [
  { id: 1, code: "SV-01", name: "NODE-HCM-01", rack: "Rack A01", ip: "10.10.1.11", cpu: 34, ram: 62, temp: 42, disk: 58, power: 380, status: "healthy" },
  { id: 2, code: "SV-02", name: "NODE-HCM-02", rack: "Rack A01", ip: "10.10.1.12", cpu: 94, ram: 78, temp: 71, disk: 62, power: 512, status: "critical" },
  { id: 3, code: "SV-03", name: "NODE-HCM-03", rack: "Rack A02", ip: "10.10.1.13", cpu: 46, ram: 51, temp: 45, disk: 66, power: 404, status: "healthy" },
  { id: 4, code: "SV-04", name: "NODE-HCM-04", rack: "Rack A02", ip: "10.10.1.14", cpu: 0,  ram: 0,  temp: 0,  disk: 0,  power: 0,   status: "offline"  },
];
const alertsSeed = [
  { id: 1, code: "ALT-2048", severity: "Critical", source: "NODE-HCM-02", message: "CPU v╞░ß╗út ng╞░ß╗íng 90% trong 2 ph├║t",     time: "2 ph├║t tr╞░ß╗¢c",  state: "Ch╞░a xß╗¡ l├╜"  },
  { id: 2, code: "ALT-2047", severity: "Critical", source: "NODE-HCM-04", message: "Mß║Ñt heartbeat qu├í 90 gi├óy",            time: "8 ph├║t tr╞░ß╗¢c",  state: "─É├ú x├íc nhß║¡n" },
  { id: 3, code: "ALT-2046", severity: "Warning",  source: "Rack A02",    message: "Nhiß╗çt ─æß╗Ö ─æß║ºu v├áo t─âng bß║Ñt th╞░ß╗¥ng",    time: "24 ph├║t tr╞░ß╗¢c", state: "─É├ú x├íc nhß║¡n" },
];
const nav = [
  ["Tß╗òng quan",   LayoutDashboard],
  ["Digital Twin",Box],
  ["Telemetry",   Activity],
  ["Cß║únh b├ío",    Bell, 3],
  ["Tickets",     Ticket, 4],
  ["B├ío c├ío PUE", BarChart3],
];

// ΓöÇΓöÇΓöÇ Helpers lß║Ñy chß╗» viß║┐t tß║»t avatar tß╗½ t├¬n ng╞░ß╗¥i d├╣ng ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function initials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ΓöÇΓöÇΓöÇ Components nhß╗Å ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function Sparkline({ values, color = "#2795e8" }) {
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${42 - v * 0.34}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 44" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} stopOpacity=".3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,44 ${points} 100,44`} fill={`url(#g${color.slice(1)})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ icon: Icon, label, value, unit, tone, values }) {
  return (
    <div className="metric card">
      <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      <div><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>
      <Sparkline values={values} color={tone === "red" ? "#ef5c68" : tone === "amber" ? "#efa83f" : "#2795e8"} />
    </div>
  );
}

function Tree({ selected, setSelected, nodes, hierarchyTree }) {
  const [open, setOpen] = useState({});
  const toggle = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));
  const isOpen = (key, defaultVal = true) => key in open ? open[key] : defaultVal;
  const Arrow = ({ id, def }) => isOpen(id, def) ? <ChevronDown /> : <ChevronRight />;

  // Nß║┐u c├│ dß╗» liß╗çu hierarchy thß║¡t tß╗½ backend ΓåÆ render tß╗½ API
  if (hierarchyTree && hierarchyTree.length > 0) {
    return (
      <div className="tree">
        {hierarchyTree.map((site) => (
          <div key={`site-${site.id}`}>
            <button className="tree-row level-0 tree-toggle" onClick={() => toggle(`site-${site.id}`)}>
              <Arrow id={`site-${site.id}`} def={true} /><Database /><span>{site.name}</span><b className="ok-dot" />
            </button>
            {isOpen(`site-${site.id}`) && site.rooms?.map((room) => (
              <div key={`room-${room.id}`}>
                <button className="tree-row level-1 tree-toggle" onClick={() => toggle(`room-${room.id}`)}>
                  <Arrow id={`room-${room.id}`} def={true} /><Box /><span>{room.name}</span>
                </button>
                {isOpen(`room-${room.id}`) && room.racks?.map((rack) => (
                  <div key={`rack-${rack.id}`}>
                    <button className="tree-row level-2 tree-toggle" onClick={() => toggle(`rack-${rack.id}`)}>
                      <Arrow id={`rack-${rack.id}`} def={true} /><Server /><span>{rack.name}</span>
                    </button>
                    {isOpen(`rack-${rack.id}`) && rack.nodes?.map((n) => {
                      const live = nodes.find((x) => x.id === n.id) || n;
                      const st = (live.status || "").toLowerCase();
                      return (
                        <button key={n.id} className={`tree-row level-3 ${selected?.id === n.id ? "selected" : ""}`}
                          onClick={() => setSelected(live)}>
                          <ChevronRight /><Cpu /><span>{n.name}</span><i className={`status-dot ${st}`} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Fallback: render tß╗½ nodes seed (khi backend ch╞░a kß║┐t nß╗æi)
  return (
    <div className="tree">
      <button className="tree-row level-0 tree-toggle" onClick={() => toggle("site")}><Arrow id="site" def={true} /><Database /><span>DC Hß╗ô Ch├¡ Minh</span><b className="ok-dot" /></button>
      {isOpen("site") && <button className="tree-row level-1 tree-toggle" onClick={() => toggle("room")}><Arrow id="room" def={true} /><Box /><span>Ph├▓ng m├íy 01</span></button>}
      {isOpen("site") && isOpen("room") && ["Rack A01", "Rack A02"].map((rack) => (
        <div key={rack}>
          <button className="tree-row level-2 tree-toggle" onClick={() => toggle(rack)}><Arrow id={rack} def={true} /><Server /><span>{rack}</span></button>
          {isOpen(rack) && nodes.filter((n) => n.rack === rack).map((n) => (
            <button key={n.id} className={`tree-row level-3 ${selected?.id === n.id ? "selected" : ""}`} onClick={() => setSelected(n)}>
              <ChevronRight /><Cpu /><span>{n.name}</span><i className={`status-dot ${n.status}`} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function AlertTable({ alerts, acknowledge, createFromAlert, full = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Mß╗¿C ─Éß╗ÿ</th><th>NGUß╗ÆN</th><th>Nß╗ÿI DUNG</th><th>THß╗£I GIAN</th><th>TRß║áNG TH├üI</th><th /></tr></thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id}>
              <td><span className={`severity ${a.severity.toLowerCase()}`}><i />{a.severity}</span></td>
              <td><b>{a.source}</b><small>{a.code || a.id}</small></td>
              <td>{a.message}</td>
              <td><Clock3 />{a.time || "Vß╗½a cß║¡p nhß║¡t"}</td>
              <td><span className="state">{a.state}</span></td>
              <td>
                <div className="row-actions">
                  {a.state === "Ch╞░a xß╗¡ l├╜" && <button className="ack" onClick={() => acknowledge(a.id)}>X├íc nhß║¡n</button>}
                  {full && <button className="ack" onClick={() => createFromAlert(a)}>Tß║ío ticket</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkspaceView({ active, nodes, selected, setSelected, alerts, tickets, report, auditLogs, history, acknowledge, createFromAlert, updateTicket, hierarchyTree, requestClosure, approveClosure, rejectClosure }) {
  const [closureTicket, setClosureTicket] = useState(null);
  const [closureSummary, setClosureSummary] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  if (active === "Digital Twin") return (
    <section className="detail-layout">
      <div className="card detail-tree"><div className="card-title"><div><h2>C├óy hß║í tß║ºng</h2><span>Site ΓåÆ Room ΓåÆ Rack ΓåÆ Node</span></div></div><Tree selected={selected} setSelected={setSelected} nodes={nodes} hierarchyTree={hierarchyTree} /></div>
      <div className="node-grid">{nodes.map((n) => (
        <button key={n.id} className={`node-card card ${selected.id === n.id ? "chosen" : ""}`} onClick={() => setSelected(n)}>
          <div className={`server-symbol ${n.status}`}><Server /></div>
          <div><b>{n.name}</b><span>{n.ip} ┬╖ {n.rack}</span></div>
          <i className={`status-dot ${n.status}`} />
          <dl>
            <div><dt>CPU</dt><dd>{n.cpu}%</dd></div>
            <div><dt>RAM</dt><dd>{n.ram}%</dd></div>
            <div><dt>Nhiß╗çt ─æß╗Ö</dt><dd>{n.temp}┬░C</dd></div>
            <div><dt>C├┤ng suß║Ñt</dt><dd>{n.power}W</dd></div>
          </dl>
        </button>
      ))}</div>
    </section>
  );

  if (active === "Telemetry") return (
    <section className="card full-panel">
      <div className="card-title">
        <div><h2>Telemetry trß╗▒c tiß║┐p</h2><span>Dß╗» liß╗çu mß╗¢i ─æ╞░ß╗úc ─æß╗ông bß╗Ö tß╗½ Collector mß╗ùi 5 gi├óy</span></div>
        <select value={selected.id} onChange={(e) => setSelected(nodes.find((n) => n.id === Number(e.target.value)))}>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      </div>
      <div className="telemetry-focus">
        <div className="selected-summary">
          <div className={`server-symbol ${selected.status}`}><Server /></div>
          <div><b>{selected.name}</b><span>{selected.ip} ┬╖ {selected.rack}</span></div>
          <div className={`status-pill ${selected.status}`}>{selected.status === "healthy" ? "Healthy" : selected.status === "critical" ? "Critical" : "Unavailable"}</div>
        </div>
        <div className="big-chart"><div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-area"><span /><span /><span /><span /><span /><Sparkline values={history} color="#2795e8" /></div></div>
        <div className="telemetry-cards">
          <Metric icon={Cpu}         label="CPU"      value={selected.cpu}         unit="%"  tone="blue"  values={history} />
          <Metric icon={Database}    label="Memory"   value={selected.ram}         unit="%"  tone="blue"  values={history.map((v) => Math.max(1, v - 12))} />
          <Metric icon={Thermometer} label="Nhiß╗çt ─æß╗Ö" value={selected.temp}        unit="┬░C" tone="red"   values={history.map((v) => v * 0.7)} />
          <Metric icon={HardDrive}   label="Disk"     value={selected.disk || 0}   unit="%"  tone="amber" values={history.map((v) => v * 0.8)} />
        </div>
      </div>
    </section>
  );

  if (active === "Cß║únh b├ío") return (
    <section className="card full-panel">
      <div className="card-title">
        <div><h2>Quß║ún l├╜ cß║únh b├ío</h2><span>{alerts.filter((a) => a.state === "Ch╞░a xß╗¡ l├╜").length} cß║únh b├ío cß║ºn x├íc nhß║¡n</span></div>
        <div className="filter-pills"><button className="selected">Tß║Ñt cß║ú</button><button>Critical</button><button>Warning</button></div>
      </div>
      <AlertTable alerts={alerts} acknowledge={acknowledge} createFromAlert={createFromAlert} full />
    </section>
  );

  if (active === "Tickets") return (
    <section className="tickets-board">
      {["OPEN", "IN_PROGRESS", "PENDING_CLOSURE", "CLOSED"].map((status) => (
        <div className="ticket-column" key={status}>
          <div className="column-head"><b>{{ OPEN: "Mới", IN_PROGRESS: "Đang xử lý", PENDING_CLOSURE: "Chờ duyệt đóng", CLOSED: "Đã đóng" }[status]}</b><span>{tickets.filter((t) => t.status === status).length}</span></div>
          {tickets.filter((t) => t.status === status).map((t) => (
            <article className="ticket-card card" key={t.id}>
              <div><span className={`priority ${t.priority?.toLowerCase()}`}>{t.priority}</span><small>{t.code}</small></div>
              <h3>{t.title}</h3><p>{t.description}</p>
              <div className="ticket-meta"><Server />{t.node}</div>
              <div className="ticket-meta"><UserRound />{t.assignee}</div>
              <select value={t.status} onChange={(e) => updateTicket(t.id, { status: e.target.value })}>
                <option value="OPEN">Mới</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="PENDING_CLOSURE">Chờ duyệt đóng</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
              {t.status === "IN_PROGRESS" && (
                <button className="ack" onClick={() => { setClosureTicket(t); setClosureSummary(""); setResolutionDetails(""); }}>Yêu cầu đóng</button>
              )}
              {t.status === "PENDING_CLOSURE" && (
                <div className="row-actions">
                  <button className="ack" onClick={() => approveClosure(t.id)}>Phê duyệt đóng</button>
                  <button className="ack" onClick={() => { setClosureTicket(t); setRejectionReason(""); }}>Từ chối</button>
                </div>
              )}
              {closureTicket?.id === t.id && (
                <div className="closure-panel">
                  {t.status === "IN_PROGRESS" ? (
                    <>
                      <textarea value={closureSummary} onChange={(e) => setClosureSummary(e.target.value)} placeholder="Tóm tắt kết quả xử lý" />
                      <textarea value={resolutionDetails} onChange={(e) => setResolutionDetails(e.target.value)} placeholder="Chi tiết nghiệm thu" />
                      <button className="primary" disabled={!closureSummary.trim() || !resolutionDetails.trim()}
                        onClick={async () => { await requestClosure(t.id, { summary: closureSummary, resolution_details: resolutionDetails }); setClosureTicket(null); }}>
                        Gửi yêu cầu
                      </button>
                    </>
                  ) : (
                    <>
                      <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Lý do từ chối yêu cầu đóng" />
                      <button className="primary" disabled={!rejectionReason.trim()}
                        onClick={async () => { await rejectClosure(t.id, { rejection_reason: rejectionReason }); setClosureTicket(null); }}>
                        Gửi từ chối
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ))}
    </section>
  );
          ))}
        </div>
      ))}
    </section>
  );

  if (active === "B├ío c├ío PUE") return (
    <section className="report-grid">
      <div className="card report-main">
        <div className="card-title"><div><h2>Chß╗ë sß╗æ PUE trong ng├áy</h2><span>Mß╗Ñc ti├¬u vß║¡n h├ánh Γëñ {report?.target || 1.5}</span></div></div>
        <div className="report-chart">
          <div className="report-bars">
            {(report?.points || []).map((p, i) => (
              <div key={p.hour} title={`${p.hour}: ${p.pue}`}>
                <i style={{ height: `${Math.max(20, (p.pue - 1) * 135)}px` }} />
                <span>{i % 2 === 0 ? p.hour : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card report-summary">
        <div className="gauge"><svg viewBox="0 0 200 115"><path d="M25 100 A75 75 0 0 1 175 100" /><path className="gauge-fill" d="M25 100 A75 75 0 0 1 175 100" /></svg><div><strong>{report?.current || 1.42}</strong><span>Tß╗æt</span></div></div>
        <div className="report-kpis">
          <div><span>PUE trung b├¼nh</span><b>{report?.average || 1.41}</b></div>
          <div><span>Tß╗òng ─æiß╗çn n─âng</span><b>{report?.summary?.totalEnergyKwh || 297.6} kWh</b></div>
          <div><span>Thiß║┐t bß╗ï IT</span><b>{report?.summary?.itEnergyKwh || 209.6} kWh</b></div>
          <div><span>L├ám m├ít</span><b>{report?.summary?.coolingEnergyKwh || 88} kWh</b></div>
        </div>
      </div>
    </section>
  );

  if (active === "Nhß║¡t k├╜ hß╗ç thß╗æng") return (
    <section className="card full-panel audit-panel">
      <div className="card-title">
        <div><h2>Nhß║¡t k├╜ hß╗ç thß╗æng</h2><span>Dß╗» liß╗çu audit log ghi tß╗½ backend v├á database</span></div>
        <div className="filter-pills"><button className="selected">Tß║Ñt cß║ú</button><button>Alert</button><button>Ticket</button><button>System</button></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>THß╗£I GIAN</th><th>NG╞»ß╗£I D├ÖNG</th><th>H├ÇNH ─Éß╗ÿNG</th><th>─Éß╗ÉI T╞»ß╗óNG</th><th>IP</th><th>CHI TIß║╛T</th></tr></thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td><Clock3 />{log.timestamp ? new Date(log.timestamp).toLocaleString("vi-VN") : "N/A"}</td>
                <td><b>{log.username || "system"}</b><small>audit #{log.id}</small></td>
                <td><span className="state">{log.action}</span></td>
                <td><b>{log.entity}</b><small>{log.targetId}</small></td>
                <td>{log.ip || "N/A"}</td>
                <td>{Object.keys(log.details || {}).length ? JSON.stringify(log.details) : "Kh├┤ng c├│"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
  return null;
}

// ΓöÇΓöÇΓöÇ Main App (Dashboard) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function App() {
  // ΓöÇΓöÇ Auth state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [authReady, setAuthReady] = useState(false);   // chß╗¥ kiß╗âm tra token lß║ºn ─æß║ºu
  const [currentUser, setCurrentUser] = useState(null); // null = ch╞░a ─æ─âng nhß║¡p

  // ΓöÇΓöÇ Dashboard state ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const [active,    setActive]    = useState("Tß╗òng quan");
  const [nodes,     setNodes]     = useState(initialNodes);
  const [selected,  setSelected]  = useState(initialNodes[1]);
  const [alerts,    setAlerts]    = useState(alertsSeed);
  const [tickets,   setTickets]   = useState([]);
  const [report,    setReport]    = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [summary,   setSummary]   = useState({ activeNodes: 3, totalNodes: 4, avgCpu: 58, maxTemp: 71, pue: 1.42 });
  const [connected, setConnected] = useState(false);
  const [hierarchyTree, setHierarchyTree] = useState([]);
  const [toast,     setToast]     = useState("");
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [tick,      setTick]      = useState(0);

  // ΓöÇΓöÇ B╞░ß╗¢c 3 & 4: Kiß╗âm tra token trong localStorage, lß║Ñy user thß║¡t tß╗½ /auth/me ΓöÇΓöÇ
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setAuthReady(true); // kh├┤ng c├│ token ΓåÆ hiß╗çn trang login
      return;
    }
    // C├│ token ΓåÆ x├íc minh vß╗¢i backend
    api.me()
      .then((userData) => {
        setCurrentUser(userData);
        setAuthReady(true);
      })
      .catch(() => {
        // Token hß║┐t hß║ín / kh├┤ng hß╗úp lß╗ç ΓåÆ x├│a, vß╗ü login
        tokenStorage.remove();
        setAuthReady(true);
      });
  }, []);

  // ΓöÇΓöÇ Callback khi login th├ánh c├┤ng: token ─æ├ú ─æ╞░ß╗úc l╞░u trong LoginPage ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const handleLoginSuccess = useCallback((userData) => {
    setCurrentUser(userData);
  }, []);

  // ΓöÇΓöÇ ─É─âng xuß║Ñt ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const handleLogout = useCallback(() => {
    tokenStorage.remove();
    setCurrentUser(null);
    setConnected(false);
    setToast("─É├ú ─æ─âng xuß║Ñt khß╗Åi hß╗ç thß╗æng.");
  }, []);

  // ΓöÇΓöÇ Load dß╗» liß╗çu dashboard ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const loadData = useCallback(async (quiet = false) => {
    try {
      const [dashboard, ticketData, pueData, auditData, treeData] = await Promise.all([
        api.dashboard(), api.tickets(), api.pue(), api.auditLogs(), api.hierarchy(),
      ]);
      setNodes(dashboard.nodes);
      setSummary(dashboard.summary);
      setAlerts(dashboard.alerts);
      setTickets(ticketData);
      setReport(pueData);
      setAuditLogs(auditData);
      setHierarchyTree(treeData || []);
      setConnected(true);
      setTick((t) => t + 1);
    } catch (error) {
      // Nß║┐u 401 ΓåÆ handleLogout (token hß║┐t hß║ín giß╗»a phi├¬n)
      if (error.message === "UNAUTHORIZED") {
        handleLogout();
        setToast("Phi├¬n ─æ─âng nhß║¡p hß║┐t hß║ín. Vui l├▓ng ─æ─âng nhß║¡p lß║íi.");
        return;
      }
      setConnected(false);
      if (!quiet) setToast("Kh├┤ng kß║┐t nß╗æi ─æ╞░ß╗úc backend ┬╖ ─æang d├╣ng dß╗» liß╗çu dß╗▒ ph├▓ng");
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!currentUser) return; // chß╗ë load khi ─æ├ú ─æ─âng nhß║¡p
    loadData();
    const timer = setInterval(() => loadData(true), 5000);
    return () => clearInterval(timer);
  }, [currentUser, loadData]);

  useEffect(() => {
    const fresh = nodes.find((n) => n.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [nodes]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const history = useMemo(
    () => Array.from({ length: 16 }, (_, i) => Math.max(12, Math.min(98,
      selected.cpu + Math.round(Math.sin((i + tick) / 2) * 9) + Math.round(Math.random() * 7)
    ))),
    [selected.id, selected.cpu, tick]
  );

  const acknowledge = async (id) => {
    try { const updated = await api.acknowledge(id); setAlerts((a) => a.map((x) => x.id === id ? updated : x)); setToast(`─É├ú x├íc nhß║¡n ${updated.code}`); }
    catch { setToast("Kh├┤ng thß╗â x├íc nhß║¡n cß║únh b├ío"); }
  };
  const createFromAlert = async (alert) => {
    try {
      const item = await api.createTicket({ node_id: alert.nodeId || 1, alert_id: alert.id, title: `Xß╗¡ l├╜: ${alert.message}`, description: `Cß║únh b├ío tß╗½ ${alert.source}`, priority: alert.severity === "Critical" ? "URGENT" : "MEDIUM", assigned_to_user_id: 2 });
      setTickets((t) => [item, ...t]); setToast(`─É├ú tß║ío ${item.code}`);
    } catch { setToast("Kh├┤ng thß╗â tß║ío ticket"); }
  };
  const updateTicket = async (id, changes) => {
    try { const item = await api.updateTicket(id, changes); setTickets((t) => t.map((x) => x.id === id ? item : x)); setToast(`Đã cập nhật ${item.code}`); }
    catch { setToast("Không thể cập nhật ticket"); }
  };
  const requestClosure = async (id, data) => {
    try { const item = await api.requestClosure(id, data); setTickets((t) => t.map((x) => x.id === id ? item : x)); setToast("Đã gửi yêu cầu đóng ticket"); }
    catch { setToast("Không thể gửi yêu cầu đóng ticket"); }
  };
  const approveClosure = async (id) => {
    try { const item = await api.approveClosure(id); setTickets((t) => t.map((x) => x.id === id ? item : x)); setToast("Đã phê duyệt đóng ticket"); }
    catch { setToast("Không thể phê duyệt đóng ticket"); }
  };
  const rejectClosure = async (id, data) => {
    try { const item = await api.rejectClosure(id, data); setTickets((t) => t.map((x) => x.id === id ? item : x)); setToast("Đã từ chối yêu cầu đóng ticket"); }
    catch { setToast("Không thể từ chối yêu cầu đóng ticket"); }
  };

  // ΓöÇΓöÇ M├án h├¼nh chß╗¥ (kiß╗âm tra token) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f7fb" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#838697" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #e0e3ed", borderTopColor: "#2795e8", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>─Éang x├íc thß╗▒c...</span>
        </div>
      </div>
    );
  }

  // ΓöÇΓöÇ Ch╞░a ─æ─âng nhß║¡p ΓåÆ hiß╗çn trang Login ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (!currentUser) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  // ΓöÇΓöÇ ─É├ú ─æ─âng nhß║¡p ΓåÆ hiß╗çn Dashboard ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const avatarText = initials(currentUser.full_name || currentUser.username || "U");

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "open" : ""}>
        <div className="brand">
          <div className="brand-mark"><Activity /></div>
          <div><strong>AR-IMMS</strong><span>COMMAND CENTER</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button>
        </div>
        <div className="workspace">
          <span>KH├öNG GIAN L├ÇM VIß╗åC</span>
          <div><div className="avatar square">DC</div><p><b>HCM Data Center</b><small>Production</small></p><ChevronDown /></div>
        </div>
        <nav>
          {nav.map(([label, Icon, badge]) => (
            <button key={label} onClick={() => { setActive(label); setMenuOpen(false); }} className={active === label ? "active" : ""}>
              <Icon /><span>{label}</span>{badge && <em>{badge}</em>}
            </button>
          ))}
        </nav>
        <div className="aside-bottom">
          <button className={active === "Nhß║¡t k├╜ hß╗ç thß╗æng" ? "active" : ""} onClick={() => { setActive("Nhß║¡t k├╜ hß╗ç thß╗æng"); setMenuOpen(false); }}><ShieldCheck />Nhß║¡t k├╜ hß╗ç thß╗æng</button>
          <button disabled title="Ch╞░a c├│ API c├ái ─æß║╖t trong backend"><Settings />C├ái ─æß║╖t</button>
          {/* N├║t ─æ─âng xuß║Ñt */}
          <button onClick={handleLogout} style={{ color: "#ec5966" }}><LogOut />─É─âng xuß║Ñt</button>
          <div className="support"><Zap /><div><b>Hß╗ç thß╗æng ß╗òn ─æß╗ïnh</b><span>Uptime 99.98%</span></div></div>
        </div>
      </aside>

      <main>
        <header>
          <button className="menu-btn" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div className="search"><Search /><input aria-label="T├¼m kiß║┐m" placeholder="T├¼m server, ticket, cß║únh b├ío..." /><kbd>Γîÿ K</kbd></div>
          <div className="header-actions">
            <div className={`live ${connected ? "" : "disconnected"}`}><i />{connected ? "Backend trß╗▒c tuyß║┐n" : "Dß╗» liß╗çu dß╗▒ ph├▓ng"}</div>
            <button className="icon-button"><Bell /><b>{summary.openAlerts || 0}</b></button>
            {/* ΓöÇΓöÇ B╞░ß╗¢c 4: Hiß╗çn user thß║¡t tß╗½ /auth/me ΓöÇΓöÇ */}
            <div className="user">
              <div className="avatar">{avatarText}</div>
              <p><b>{currentUser.full_name || currentUser.username}</b><span>{currentUser.role}</span></p>
              <ChevronDown />
            </div>
          </div>
        </header>

        <div className="content">
          <div className="page-head">
            <div>
              <p>COMMAND CENTER / {active.toUpperCase()}</p>
              <h1>{active === "Tß╗òng quan" ? "Tß╗òng quan vß║¡n h├ánh" : active}</h1>
              <span>Cß║¡p nhß║¡t tß╗▒ ─æß╗Öng mß╗ùi 5 gi├óy ┬╖ {summary.totalNodes || nodes.length} nodes ─æang gi├ím s├ít</span>
            </div>
            <div className="page-actions">
              <button onClick={() => window.print()}><FileText />Xuß║Ñt b├ío c├ío</button>
              <button className="primary" onClick={() => loadData()}><Activity />─Éß╗ông bß╗Ö ngay</button>
            </div>
          </div>

          {active !== "Tß╗òng quan" ? (
            <WorkspaceView
              active={active} nodes={nodes} selected={selected} setSelected={setSelected}
              alerts={alerts} tickets={tickets} report={report} auditLogs={auditLogs}
              history={history} acknowledge={acknowledge} createFromAlert={createFromAlert}
              updateTicket={updateTicket} hierarchyTree={hierarchyTree}
              requestClosure={requestClosure} approveClosure={approveClosure} rejectClosure={rejectClosure}
            />
          ) : (
            <>
              <section className="metrics-grid">
                <Metric icon={Server}      label="Nodes hoß║ít ─æß╗Öng"  value={`${summary.activeNodes}/${summary.totalNodes}`} unit=""  tone="purple" values={[56,61,58,72,75,74,78,76]} />
                <Metric icon={Cpu}         label="CPU trung b├¼nh"    value={summary.avgCpu}  unit="%"  tone="blue"  values={[45,48,50,47,55,59,56,58]} />
                <Metric icon={Thermometer} label="Nhiß╗çt ─æß╗Ö cao nhß║Ñt" value={summary.maxTemp} unit="┬░C" tone="red"   values={[52,55,54,60,58,65,68,71]} />
                <Metric icon={Gauge}       label="PUE hiß╗çn tß║íi"      value={summary.pue}     unit=""   tone="amber" values={[44,43,45,42,41,43,42,42]} />
              </section>

              <section className="dashboard-grid">
                <div className="card twin-panel">
                  <div className="card-title"><div><h2>Digital Twin</h2><span>Cß║Ñu tr├║c hß║í tß║ºng thß╗¥i gian thß╗▒c</span></div><button><MoreHorizontal /></button></div>
                  <Tree selected={selected} setSelected={setSelected} nodes={nodes} hierarchyTree={hierarchyTree} />
                  <div className="legend">
                    <span><i className="status-dot healthy" />Hoß║ít ─æß╗Öng</span>
                    <span><i className="status-dot critical" />Cß║únh b├ío</span>
                    <span><i className="status-dot offline" />Mß║Ñt kß║┐t nß╗æi</span>
                  </div>
                </div>
                <div className="card telemetry-panel">
                  <div className="card-title">
                    <div><h2>Telemetry thß╗¥i gian thß╗▒c</h2><span>{selected.name} ┬╖ {selected.ip}</span></div>
                    <select aria-label="Khoß║úng thß╗¥i gian"><option>15 ph├║t</option><option>1 giß╗¥</option><option>24 giß╗¥</option></select>
                  </div>
                  <div className="selected-summary">
                    <div className={`server-symbol ${selected.status}`}><Server /></div>
                    <div><b>{selected.name}</b><span>{selected.rack} ┬╖ Ubuntu Server 22.04</span></div>
                    <div className={`status-pill ${selected.status}`}>{selected.status === "healthy" ? "Healthy" : selected.status === "critical" ? "Critical" : "Unavailable"}</div>
                  </div>
                  <div className="chart">
                    <div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
                    <div className="chart-area"><span /><span /><span /><span /><span /><Sparkline values={history} color="#2795e8" /><div className="chart-x"><b>14:20</b><b>14:25</b><b>14:30</b><b>B├óy giß╗¥</b></div></div>
                  </div>
                  <div className="telemetry-stats">
                    <div><Cpu /><span>CPU</span><strong>{selected.cpu}%</strong></div>
                    <div><Database /><span>Memory</span><strong>{selected.ram}%</strong></div>
                    <div><Thermometer /><span>Nhiß╗çt ─æß╗Ö</span><strong>{selected.temp}┬░C</strong></div>
                    <div><Zap /><span>C├┤ng suß║Ñt</span><strong>{selected.power}W</strong></div>
                  </div>
                </div>
              </section>

              <section className="bottom-grid">
                <div className="card alerts">
                  <div className="card-title">
                    <div><h2>Cß║únh b├ío gß║ºn ─æ├óy</h2><span>{alerts.filter((a) => a.state === "Ch╞░a xß╗¡ l├╜").length} cß║únh b├ío cß║ºn xß╗¡ l├╜</span></div>
                    <button className="text-button" onClick={() => setActive("Cß║únh b├ío")}>Xem tß║Ñt cß║ú <ChevronRight /></button>
                  </div>
                  <AlertTable alerts={alerts} acknowledge={acknowledge} createFromAlert={createFromAlert} />
                </div>
                <div className="card pue">
                  <div className="card-title"><div><h2>Hiß╗çu suß║Ñt n─âng l╞░ß╗úng</h2><span>PUE trong ng├áy</span></div><button><MoreHorizontal /></button></div>
                  <div className="gauge"><svg viewBox="0 0 200 115"><path d="M25 100 A75 75 0 0 1 175 100" /><path className="gauge-fill" d="M25 100 A75 75 0 0 1 175 100" /></svg><div><strong>{summary.pue}</strong><span>Tß╗æt</span></div></div>
                  <div className="pue-row">
                    <div><span>Tß╗òng ─æiß╗çn n─âng</span><b>{report?.summary?.totalEnergyKwh || 297.6} kWh</b></div>
                    <div><span>Thiß║┐t bß╗ï IT</span><b>{report?.summary?.itEnergyKwh || 209.6} kWh</b></div>
                  </div>
                  <div className="pue-note"><span>Γåô 4.1%</span> so vß╗¢i h├┤m qua</div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
      {toast && <div className="toast"><ShieldCheck />{toast}</div>}
    </div>
  );
}
