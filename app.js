const DAY = 86400000;
const T = new Date();
T.setHours(0, 0, 0, 0);

function ad(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function am(d, n) {
  const x = new Date(d.getTime());
  x.setMonth(x.getMonth() + n);
  return x;
}

function f(d) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowStamp() {
  const n = new Date();
  const hh = String(n.getHours()).padStart(2, "0");
  const mm = String(n.getMinutes()).padStart(2, "0");
  const ss = String(n.getSeconds()).padStart(2, "0");
  return `${f(n)} ${hh}:${mm}:${ss}`;
}

function esc(s) {
  const e = document.createElement("div");
  e.textContent = String(s);
  return e.innerHTML;
}

function chip(cls, txt) {
  return `<span class="chip ${cls}">${esc(txt)}</span>`;
}

/* Mock login users (Patty / Sam) */
const mockUsers = [
  { email: "Patty", role: "資安管理示範", online: true },
  { email: "Sam", role: "直屬主管檢視示範", online: true },
  { email: "Patty（已登出模擬）", role: "已登出（唯讀檢視）", online: false }
];
let userIdx = 0;

function currentActor() {
  return mockUsers[userIdx].email;
}

function renderUserPanel() {
  const u = mockUsers[userIdx];
  const dot = document.getElementById("userDot");
  const lbl = document.getElementById("userLabel");
  dot.className = u.online ? "dot-online" : "dot-offline";
  lbl.textContent = u.online
    ? `假設登入：${u.email}（${u.role}）`
    : `${u.email}（${u.role}）`;
}

/* Audit timeline & home audit log */
let auditLogs = [
  { time: nowStamp(), actor: "Patty", action: "初始化假設查核週期與缺失追蹤工作台" },
  { time: nowStamp(), actor: "Patty", action: "載入證交所 115.08.13 檢查機制參考條文對照" }
];

function addAuditLog(action) {
  auditLogs.unshift({
    time: nowStamp(),
    actor: currentActor(),
    action
  });
  if (auditLogs.length > 25) {
    auditLogs = auditLogs.slice(0, 25);
  }
  renderAuditViews();
  saveState();
}

function renderAuditViews() {
  const homeEl = document.getElementById("homeAuditLog");
  const trkEl = document.getElementById("trkTimeline");
  const html = auditLogs.map((entry) => `
    <li>
      <span class="tl-time">${esc(entry.time)}・${esc(entry.actor)}</span>
      <span>${esc(entry.action)}</span>
    </li>
  `).join("");
  if (homeEl) homeEl.innerHTML = html;
  if (trkEl) trkEl.innerHTML = html;
}

document.getElementById("switchUserBtn").addEventListener("click", () => {
  userIdx = (userIdx + 1) % mockUsers.length;
  renderUserPanel();
  addAuditLog(`切換假設帳號至 ${mockUsers[userIdx].email}`);
});

/* Navigation */
const navTabs = document.querySelectorAll(".top-nav button[data-view]");
const views = document.querySelectorAll("section[id^='view-']");

function switchView(viewName, scrollTarget) {
  navTabs.forEach((btn) => {
    const active = btn.dataset.view === viewName;
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  views.forEach((sec) => {
    sec.hidden = sec.id !== `view-${viewName}`;
  });
  try {
    history.replaceState(null, "", `#${viewName}`);
  } catch (e) {}
  if (viewName === "prac_trk") renderPrac();
  if (viewName === "rpt") renderReport();
  if (viewName === "cal") renderCal();
  if (viewName === "home") {
    renderHomeIntel();
    renderAuditViews();
  }
  if (scrollTarget) {
    const el = document.querySelector(scrollTarget);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

document.getElementById("backHomeBtn").addEventListener("click", () => {
  switchView("home");
  addAuditLog("返回首頁總覽與操作稽核紀錄");
});

navTabs.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelectorAll("[data-view]").forEach((btn) => {
  if (btn.closest(".top-nav")) return;
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

/* Practical scenarios: single conversational bubble per step */
let curPrac = "verify";
let vStep = 0;
let aStep = 0;
let tStep = 0;

const vSteps = [
  {
    t: "步驟 1・判讀漏洞與影響",
    c: "💬 這筆先看參數來源跟影響範圍，確認不是測試環境誤報再排修補。"
  },
  {
    t: "步驟 2・對齊修補方式與期限",
    c: "💬 我們對齊一下後端驗證怎麼改、哪天修完，我先記進追蹤表。"
  },
  {
    t: "步驟 3・核對證據與複測",
    c: "💬 修補說明跟複測結果我都對過了，這筆可以改「複測通過／結案」。"
  }
];

const aSteps = [
  {
    t: "步驟 1・清冊與紀錄比對",
    c: "💬 先跑比對把已離職未停用、權限怪的帳號挑出來，省去人工漏看。"
  },
  {
    t: "步驟 2・AI 彙整與對原文",
    c: "💬 AI 幫我把重點先拉出來，但我一定會回頭對原文跟實際數字。"
  },
  {
    t: "步驟 3・追蹤狀態標準化",
    c: "💬 欄位都收整齊了，轉入缺失追蹤表後要對各窗口出報表很快。"
  }
];

const tSteps = [
  {
    t: "步驟 1・SOP 與流程整理",
    c: "💬 把查核與交接步驟整理成清楚清單，大家照著走就不會漏。"
  },
  {
    t: "步驟 2・演練情境與宣導",
    c: "💬 演練情境跟宣導重點我會抓貼近日常的案例，搭配測驗加深印象。"
  },
  {
    t: "步驟 3・成效追蹤與補訓",
    c: "💬 點擊跟回報統計出來後，需要補訓的名單我會追到完成並留紀錄。"
  }
];

function buildThreeStepSvg(activeIdx, cards, ariaLabel, attrName) {
  const c0 = cards[0];
  const c1 = cards[1];
  const c2 = cards[2];
  const f0 = activeIdx === 0 ? "#a81148" : "#ffffff";
  const t0 = activeIdx === 0 ? "#ffffff" : "#18181b";
  const m0 = activeIdx === 0 ? "#fce8f0" : "#64646d";
  const f1 = activeIdx === 1 ? "#a81148" : "#ffffff";
  const t1 = activeIdx === 1 ? "#ffffff" : "#18181b";
  const m1 = activeIdx === 1 ? "#fce8f0" : "#64646d";
  const f2 = activeIdx === 2 ? "#a81148" : "#ffffff";
  const t2 = activeIdx === 2 ? "#ffffff" : "#18181b";
  const m2 = activeIdx === 2 ? "#fce8f0" : "#64646d";

  return `
    <div class="svg-wrap">
      <svg viewBox="0 0 680 92" role="img" aria-label="${esc(ariaLabel)}">
        <g class="step-card-hit" ${attrName}="0" tabindex="0" role="button" aria-pressed="${activeIdx === 0 ? "true" : "false"}">
          <rect x="8" y="12" width="196" height="64" rx="10" fill="${f0}" stroke="#a81148" stroke-width="2"/>
          <text x="106" y="40" text-anchor="middle" font-size="13" font-weight="700" fill="${t0}">${esc(c0.main)}</text>
          <text x="106" y="60" text-anchor="middle" font-size="11" fill="${m0}">${esc(c0.sub)}</text>
        </g>
        <polygon points="212,44 228,36 228,52" fill="#a81148"/>
        <g class="step-card-hit" ${attrName}="1" tabindex="0" role="button" aria-pressed="${activeIdx === 1 ? "true" : "false"}">
          <rect x="236" y="12" width="196" height="64" rx="10" fill="${f1}" stroke="#a81148" stroke-width="2"/>
          <text x="334" y="40" text-anchor="middle" font-size="13" font-weight="700" fill="${t1}">${esc(c1.main)}</text>
          <text x="334" y="60" text-anchor="middle" font-size="11" fill="${m1}">${esc(c1.sub)}</text>
        </g>
        <polygon points="440,44 456,36 456,52" fill="#a81148"/>
        <g class="step-card-hit" ${attrName}="2" tabindex="0" role="button" aria-pressed="${activeIdx === 2 ? "true" : "false"}">
          <rect x="464" y="12" width="208" height="64" rx="10" fill="${f2}" stroke="#a81148" stroke-width="2"/>
          <text x="568" y="40" text-anchor="middle" font-size="13" font-weight="700" fill="${t2}">${esc(c2.main)}</text>
          <text x="568" y="60" text-anchor="middle" font-size="11" fill="${m2}">${esc(c2.sub)}</text>
        </g>
      </svg>
    </div>
  `;
}

function buildStepBoxBarAndBubble(activeIdx, steps, btnLabels, attrName) {
  const s = steps[activeIdx];
  return `
    <div class="step-box-btns">
      <button type="button" class="act ${activeIdx === 0 ? "pri" : ""}" ${attrName}="0">${esc(btnLabels[0])}</button>
      <button type="button" class="act ${activeIdx === 1 ? "pri" : ""}" ${attrName}="1">${esc(btnLabels[1])}</button>
      <button type="button" class="act ${activeIdx === 2 ? "pri" : ""}" ${attrName}="2">${esc(btnLabels[2])}</button>
    </div>
    <div class="chat-stage">
      <div class="chat-avatar" aria-hidden="true">Patty</div>
      <div class="chat-bubble-wrap">
        <div class="chat-bubble-head">${esc(s.t)}</div>
        <p class="chat-sub-bubble">${esc(s.c)}</p>
      </div>
    </div>
  `;
}

function bindStepTriggers(container, attrName, onSelect) {
  container.querySelectorAll(`.step-card-hit[${attrName}], .step-box-btns button[${attrName}]`).forEach((el) => {
    const val = Number(el.getAttribute(attrName));
    el.addEventListener("click", () => onSelect(val));
    if (el.classList.contains("step-card-hit")) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(val);
        }
      });
    }
  });
}

const accRows = [
  { u: "u101", hr: "在職", sys: "啟用中", role: "一般查詢", flag: "正常", checked: false },
  { u: "u102", hr: "已離職（11/10）", sys: "啟用中", role: "系統管理", flag: "未停用異常", checked: false },
  { u: "u103", hr: "在職", sys: "啟用中", role: "特殊權限", flag: "權限待複核", checked: false },
  { u: "u104", hr: "在職", sys: "已停用", role: "一般查詢", flag: "正常", checked: false }
];

const drillRows = [
  { dept: "交易與客服組", sent: 25, click: 4, rep: 12, retrain: "已完成" },
  { dept: "系統與維運組", sent: 15, click: 1, rep: 10, retrain: "免補訓" },
  { dept: "營運與行政組", sent: 20, click: 6, rep: 7, retrain: "補訓追蹤中" }
];

document.getElementById("pracBtns").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-p]");
  if (!b) return;
  curPrac = b.dataset.p;
  document.querySelectorAll("#pracBtns button").forEach((x) => {
    x.setAttribute("aria-pressed", x === b ? "true" : "false");
  });
  renderPrac();
});

function renderPrac() {
  const stage = document.getElementById("pracStage");
  if (curPrac === "verify") {
    const svgHtml = buildThreeStepSvg(
      vStep,
      [
        { main: "① 判讀漏洞與影響", sub: "刷掉誤報・看實際影響" },
        { main: "② 對齊修補與期限", sub: "對齊做法・寫入追蹤" },
        { main: "③ 核對證據與複測", sub: "看複測結果・更新結案" }
      ],
      "判讀與驗證三步驟圖示",
      "data-vs"
    );
    const detailHtml = buildStepBoxBarAndBubble(
      vStep,
      vSteps,
      ["步驟 1：判讀", "步驟 2：對齊", "步驟 3：複測"],
      "data-vs"
    );
    stage.innerHTML = `
      <div class="box" style="background:var(--bg);margin-bottom:0">
        <h3>判讀與驗證測試（點步驟按鈕或上方卡片切換）</h3>
        ${svgHtml}
        ${detailHtml}
      </div>
    `;
    bindStepTriggers(stage, "data-vs", (val) => {
      vStep = val;
      renderPrac();
    });
  } else if (curPrac === "auto") {
    const flagged = accRows.filter((r) => r.flag !== "正常");
    const svgHtml = buildThreeStepSvg(
      aStep,
      [
        { main: "① 清冊與紀錄比對", sub: "腳本／比對快速抓異常" },
        { main: "② AI 彙整與對原文", sub: "先抓重點・再回頭核對" },
        { main: "③ 追蹤狀態標準化", sub: "欄位統一・快速出報表" }
      ],
      "工具與自動化三步驟圖示",
      "data-as"
    );
    const detailHtml = buildStepBoxBarAndBubble(
      aStep,
      aSteps,
      ["步驟 1：比對", "步驟 2：彙整", "步驟 3：標準化"],
      "data-as"
    );
    const trHtml = accRows.map((r, idx) => {
      const isAbn = r.flag !== "正常";
      const badge = isAbn ? chip("bad", r.flag) : chip("ok", r.flag);
      const actBtn = isAbn
        ? `<button type="button" class="act ${r.checked ? "" : "pri"}" data-acc="${idx}">${r.checked ? "已列入（點此看表）" : "轉入缺失表"}</button>`
        : "—";
      return `<tr><td>${esc(r.u)}</td><td>${esc(r.hr)}</td><td>${esc(r.sys)}</td><td>${esc(r.role)}</td><td>${badge}</td><td>${actBtn}</td></tr>`;
    }).join("");

    stage.innerHTML = `
      <div class="box" style="background:var(--bg);margin-bottom:0">
        <h3>工具與自動化實作（點步驟按鈕或上方卡片切換）</h3>
        ${svgHtml}
        ${detailHtml}
        <div class="scroll">
          <table>
            <thead><tr><th>帳號</th><th>人事狀態</th><th>系統狀態</th><th>權限／角色</th><th>比對結果</th><th>轉入追蹤</th></tr></thead>
            <tbody>${trHtml}</tbody>
          </table>
        </div>
        <p class="note">異常共 <strong>${flagged.length}</strong> 筆（點「轉入缺失表」會加進下方缺失追蹤表）。</p>
      </div>
    `;

    bindStepTriggers(stage, "data-as", (val) => {
      aStep = val;
      renderPrac();
    });

    stage.querySelectorAll("button[data-acc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.acc);
        const r = accRows[idx];
        if (!r.checked) {
          r.checked = true;
          const nextId = `F-${String(items.length + 1).padStart(3, "0")}`;
          const summary = `帳號 ${r.u}（${r.flag}／${r.hr}）待核查處理`;
          items.push({
            id: nextId,
            src: "內部稽核",
            sys: "內部網路與 AD",
            sum: summary,
            risk: "高",
            own: "Infra",
            due: ad(T, 7),
            st: "待修補"
          });
          renderTrk();
          renderReport();
          renderPrac();
          setTrkFeedback(`已將 ${r.u} 轉入缺失追蹤表（${nextId}）`);
          addAuditLog(`自帳號比對轉入缺失 ${nextId}：${summary}`);
        }
        const trkEl = document.getElementById("trkBox");
        if (trkEl) trkEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  } else {
    const totSent = drillRows.reduce((a, b) => a + b.sent, 0);
    const totClick = drillRows.reduce((a, b) => a + b.click, 0);
    const totRep = drillRows.reduce((a, b) => a + b.rep, 0);
    const svgHtml = buildThreeStepSvg(
      tStep,
      [
        { main: "① SOP 與流程整理", sub: "步驟寫清楚・照著做" },
        { main: "② 演練情境與宣導", sub: "釣魚演練・重點提醒" },
        { main: "③ 成效追蹤與補訓", sub: "看數據・追補訓留存" }
      ],
      "模擬演練與教育訓練三步驟圖示",
      "data-ts"
    );
    const detailHtml = buildStepBoxBarAndBubble(
      tStep,
      tSteps,
      ["步驟 1：SOP", "步驟 2：演練宣導", "步驟 3：補訓追蹤"],
      "data-ts"
    );
    const drHtml = drillRows.map((r, idx) => {
      const done = r.retrain === "已完成" || r.retrain === "免補訓";
      const badge = done ? chip("ok", r.retrain) : chip("warn", r.retrain);
      const actCell = !done
        ? `<button type="button" class="act pri" data-dr="${idx}">標記補訓完成</button>`
        : "—";
      return `<tr><td>${esc(r.dept)}</td><td>${r.sent}</td><td>${r.click}</td><td>${r.rep}</td><td>${badge}</td><td>${actCell}</td></tr>`;
    }).join("");

    stage.innerHTML = `
      <div class="box" style="background:var(--bg);margin-bottom:0">
        <h3>模擬／演練與教育訓練（點步驟按鈕或上方卡片切換）</h3>
        ${svgHtml}
        ${detailHtml}
        <div class="stats" style="margin-bottom:10px">
          <div class="card"><b>${totSent}</b>演練寄送</div>
          <div class="card"><b>${totClick}</b>點擊測試</div>
          <div class="card"><b>${totRep}</b>主動回報</div>
        </div>
        <div class="scroll">
          <table>
            <thead><tr><th>部門（假設）</th><th>寄送數</th><th>點擊數</th><th>回報數</th><th>補訓／追蹤狀態</th><th>操作</th></tr></thead>
            <tbody>${drHtml}</tbody>
          </table>
        </div>
      </div>
    `;

    bindStepTriggers(stage, "data-ts", (val) => {
      tStep = val;
      renderPrac();
    });

    stage.querySelectorAll("button[data-dr]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.dr);
        drillRows[idx].retrain = "已完成";
        renderPrac();
        addAuditLog(`更新「${drillRows[idx].dept}」社交工程補訓狀態為「已完成」`);
      });
    });
  }
}

/* Check cycle */
const LAW = "https://twse-regulation.twse.com.tw/m/LawContent.aspx?FID=FL007290";
const LAW2 = "https://twse-regulation.twse.com.tw/ENG/TW/int/DAT01_print.aspx?FLCODE=FE391032";

function defaultChecks() {
  const base = [
    { n: "資通系統弱點掃描與缺失追蹤", fq: "每半年", m: 6, c: "CC-19000(9)", fit: "對應弱掃報告判讀與缺失追蹤，確認風險評估或修補留存", ago: 150 },
    { n: "資通系統帳號與權限適切性審查", fq: "每半年", m: 6, c: "CC-18000(2)f", fit: "對應權限檢視與稽核紀錄核對，確保帳號權限符合職責", ago: 200 },
    { n: "社交工程演練與後續教育訓練", fq: "每年", m: 12, c: "CC-17010 f(h)", fit: "對應年度社交工程演練與資安教育訓練規劃與追蹤", ago: 330 },
    { n: "稽核日誌留存（至少三年）與定期檢視", fq: "定期", m: 1, c: "CC-18000(4)", fit: "對應日誌留存與定期檢視，銜接個資／操作軌跡查核", ago: 20 },
    { n: "資通安全健診（限提供網際網路下單者）", fq: "期限", m: -1, c: "證交所 114.07.03 函", fit: "對應網際網路下單券商 115/12/31 前完成資通安全健診期限", u: LAW2, due: new Date(2026, 11, 31) }
  ];
  base.forEach((x) => {
    if (x.ago != null) x.last = ad(T, -x.ago);
  });
  return base;
}

let checks = defaultChecks();

function due(x) {
  if (x.due) return new Date(x.due);
  if (x.m > 0 && x.last) return am(new Date(x.last), x.m);
  return null;
}

function stat(x) {
  const d = due(x);
  if (!d) return { t: "每日例行", c: "mute", k: 3 };
  const n = Math.round((d - T) / DAY);
  if (n < 0) return { t: `逾期 ${-n} 天`, c: "bad", k: 0, n };
  if (n <= 60) return { t: `${n} 天內到期`, c: "warn", k: 1, n };
  return { t: `正常（剩 ${n} 天）`, c: "ok", k: 2, n };
}

function renderCal() {
  const rows = checks.map((x, i) => ({ x, i, d: due(x), s: stat(x) }));
  rows.sort((a, b) => (a.d ? a.d.getTime() : 9e15) - (b.d ? b.d.getTime() : 9e15));
  const late = rows.filter((r) => r.s.k === 0).length;
  const soon = rows.filter((r) => r.s.k === 1).length;
  document.getElementById("calStats").innerHTML = `
    <div class="card"><b>${checks.length}</b>核心項目</div>
    <div class="card card-overdue"><b>${late}</b>已逾期</div>
    <div class="card"><b>${soon}</b>60 天內到期</div>
  `;

  document.getElementById("calBody").innerHTML = rows.map((r) => {
    const x = r.x;
    const href = esc(x.u || LAW);
    const actBtn = x.m > 0 ? `<button class="act" data-i="${r.i}">完成今天</button>` : "";
    return `
      <tr${r.s.k === 0 ? ' class="late"' : ""}>
        <td>${esc(x.n)}</td>
        <td>${esc(x.fq)}</td>
        <td><a href="${href}" target="_blank" rel="noopener">${esc(x.c)}</a><div class="note" style="margin-top:3px">${esc(x.fit)}</div></td>
        <td>${x.last ? f(new Date(x.last)) : "—"}</td>
        <td>${r.d ? f(r.d) : "每日"}</td>
        <td>${chip(r.s.c, r.s.t)}</td>
        <td>${actBtn}</td>
      </tr>
    `;
  }).join("");
}

document.getElementById("calBody").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-i]");
  if (!b) return;
  const idx = Number(b.dataset.i);
  checks[idx].last = new Date(T.getTime());
  renderCal();
  renderReport();
  renderHomeIntel();
  addAuditLog(`查核項目「${checks[idx].n}」標記完成今天（${f(T)}）`);
});

/* Findings tracker */
const ST = ["待修補", "修補中", "已修補待複測", "複測通過", "結案"];

function defaultItems() {
  const raw = [
    { src: "弱點掃描", sys: "官方網站", sum: "TLS 設定仍允許較舊協定版本", risk: "中", own: "Infra", due: ad(T, 12), st: "修補中" },
    { src: "滲透測試", sys: "網際網路下單系統（核心）", sum: "某 API 端點缺少伺服器端輸入檢查", risk: "高", own: "應用開發", due: ad(T, -3), st: "待修補" },
    { src: "內部稽核", sys: "客戶資料庫", sum: "離職人員帳號超過期限未停用", risk: "高", own: "Infra", due: ad(T, 5), st: "已修補待複測" },
    { src: "社交工程演練", sys: "內部網路與 AD", sum: "部分同仁開啟釣魚信件連結，尚未完成補訓", risk: "低", own: "資安", due: ad(T, 40), st: "待修補" },
    { src: "弱點掃描", sys: "行動 App", sum: "第三方函式庫版本過舊", risk: "中", own: "行動開發", due: ad(T, -10), st: "複測通過" },
    { src: "資安健診", sys: "內部網路與 AD", sum: "防火牆有六個月內無流量之規則待評估", risk: "低", own: "Infra", due: ad(T, 60), st: "結案" }
  ];
  raw.forEach((x, i) => {
    x.id = `F-${String(i + 1).padStart(3, "0")}`;
  });
  return raw;
}

let items = defaultItems();
const R = { 高: "bad", 中: "warn", 低: "ok" };
const DD = { 高: 7, 中: 30, 低: 90 };

function isOpen(x) {
  return x.st !== "結案" && x.st !== "複測通過";
}

function isLate(x) {
  return isOpen(x) && new Date(x.due) < T;
}

/* Home visual intelligence (Bar / Pie + Overdue drilldown & return) */
let homeChartType = "bar";
let showOverdueDetail = false;

document.getElementById("intelChartBtns").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-ctype]");
  if (!b) return;
  homeChartType = b.dataset.ctype;
  showOverdueDetail = false;
  document.querySelectorAll("#intelChartBtns button").forEach((x) => {
    x.setAttribute("aria-pressed", x === b ? "true" : "false");
  });
  renderHomeIntel();
});

document.getElementById("toggleOverdueBtn").addEventListener("click", () => {
  showOverdueDetail = !showOverdueDetail;
  renderHomeIntel();
});

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function buildPieSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z"
  ].join(" ");
}

function renderHomeIntel() {
  const stage = document.getElementById("homeIntelStage");
  if (!stage) return;

  const lateItems = items.filter(isLate);
  const calLateRows = checks
    .map((x) => ({ x, d: due(x), s: stat(x) }))
    .filter((r) => r.s.k === 0);
  const totalOverdue = lateItems.length + calLateRows.length;

  const toggleBtn = document.getElementById("toggleOverdueBtn");
  if (toggleBtn) {
    toggleBtn.textContent = showOverdueDetail
      ? "返回態勢圖表"
      : `查看逾期明細（共 ${totalOverdue} 筆）`;
  }

  if (showOverdueDetail) {
    const itemCards = lateItems.map((x) => `
      <li class="overdue-item">
        <div><strong>${esc(x.id)}</strong>・${esc(x.sys)}（負責：${esc(x.own)}｜${esc(x.risk)}風險）</div>
        <div>缺失：${esc(x.sum)}｜期限：${f(new Date(x.due))}｜狀態：${esc(x.st)}</div>
      </li>
    `).join("");

    const calCards = calLateRows.map((r) => `
      <li class="overdue-item">
        <div><strong>查核逾期</strong>・${esc(r.x.n)}（${esc(r.x.c)}）</div>
        <div>上次完成：${r.x.last ? f(new Date(r.x.last)) : "—"}｜期限：${r.d ? f(r.d) : "—"}（${esc(r.s.t)}）</div>
      </li>
    `).join("");

    const combined = (itemCards + calCards) || `<li class="overdue-item">目前沒有逾期項目。</li>`;

    stage.innerHTML = `
      <div class="overdue-inspect-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <strong style="color:var(--op)">逾期對象明細（目前共 ${totalOverdue} 筆）</strong>
          <button type="button" class="act" id="backFromOverdueBtn">返回圖表</button>
        </div>
        <ul class="overdue-list">${combined}</ul>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="act pri" data-view="prac_trk">前往缺失追蹤表處理</button>
          <button type="button" class="act" data-view="cal">前往查核行事曆</button>
        </div>
      </div>
    `;

    const backBtn = document.getElementById("backFromOverdueBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        showOverdueDetail = false;
        renderHomeIntel();
      });
    }
    stage.querySelectorAll("button[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });
    return;
  }

  const openItems = items.filter(isOpen);
  const closedCount = items.length - openItems.length;
  const calSoonCount = checks
    .map((x) => stat(x))
    .filter((s) => s.k === 1).length;

  const series = [
    { label: "核心查核", val: checks.length, fill: "#3b5998", overdue: false },
    { label: "未結案缺失", val: openItems.length, fill: "#d81b60", overdue: false },
    { label: "已結案缺失", val: closedCount, fill: "#1f6f54", overdue: false },
    { label: "60天內查核", val: calSoonCount, fill: "#9a5b13", overdue: false },
    { label: "已逾期項目", val: totalOverdue, fill: "#a81148", overdue: true }
  ];

  if (homeChartType === "bar") {
    const maxVal = Math.max(1, ...series.map((s) => s.val));
    const rowsSvg = series.map((s, idx) => {
      const y = 26 + idx * 34;
      const w = s.val === 0 ? 4 : Math.max(14, Math.round((s.val / maxVal) * 280));
      const clickAttr = s.overdue ? ` class="step-card-hit" data-jump-overdue="1" tabindex="0" role="button"` : "";
      return `
        <g${clickAttr}>
          <text x="12" y="${y + 15}" font-size="12" font-weight="${s.overdue ? "700" : "500"}" fill="${s.overdue ? "#a81148" : "#18181b"}">${esc(s.label)}</text>
          <rect x="105" y="${y}" width="${w}" height="22" rx="5" fill="${s.fill}"/>
          <text x="${114 + w}" y="${y + 15}" font-size="12" font-weight="700" fill="${s.overdue ? "#a81148" : "#18181b"}">${s.val}${s.overdue ? "（點看誰）" : ""}</text>
        </g>
      `;
    }).join("");

    stage.innerHTML = `
      <div class="intel-chart-stage">
        <svg viewBox="0 0 460 202" role="img" aria-label="首頁態勢長條圖">
          <text x="12" y="16" font-size="11.5" font-weight="700" fill="#64646d">查核與缺失數量長條圖</text>
          ${rowsSvg}
        </svg>
      </div>
    `;
  } else {
    const sumVal = Math.max(1, series.reduce((a, b) => a + b.val, 0));
    let curDeg = 0;
    const slicesSvg = series.map((s) => {
      const span = (s.val / sumVal) * 360;
      const startDeg = curDeg;
      const endDeg = curDeg + span;
      curDeg = endDeg;
      if (s.val === 0) return "";
      if (span >= 359.9) {
        return `<circle cx="105" cy="100" r="72" fill="${s.fill}"/>`;
      }
      const d = buildPieSlicePath(105, 100, 72, startDeg, endDeg);
      const clickAttr = s.overdue ? ` class="step-card-hit" data-jump-overdue="1"` : "";
      return `<path d="${d}" fill="${s.fill}" stroke="#ffffff" stroke-width="1.5"${clickAttr}/>`;
    }).join("");

    const legendSvg = series.map((s, idx) => {
      const y = 34 + idx * 30;
      const clickAttr = s.overdue ? ` class="step-card-hit" data-jump-overdue="1"` : "";
      return `
        <g${clickAttr}>
          <rect x="205" y="${y}" width="14" height="14" rx="3" fill="${s.fill}"/>
          <text x="226" y="${y + 12}" font-size="11.5" font-weight="${s.overdue ? "700" : "500"}" fill="${s.overdue ? "#a81148" : "#18181b"}">${esc(s.label)}：${s.val}</text>
        </g>
      `;
    }).join("");

    stage.innerHTML = `
      <div class="intel-chart-stage">
        <svg viewBox="0 0 440 200" role="img" aria-label="首頁態勢圓餅圖">
          <text x="12" y="16" font-size="11.5" font-weight="700" fill="#64646d">查核與缺失分布圓餅圖</text>
          ${slicesSvg}
          <circle cx="105" cy="100" r="30" fill="#f7f7f8"/>
          <text x="105" y="97" text-anchor="middle" font-size="10" fill="#64646d">逾期</text>
          <text x="105" y="112" text-anchor="middle" font-size="13" font-weight="800" fill="#a81148">${totalOverdue}</text>
          ${legendSvg}
        </svg>
      </div>
    `;
  }

  stage.querySelectorAll("[data-jump-overdue]").forEach((el) => {
    el.addEventListener("click", () => {
      showOverdueDetail = true;
      renderHomeIntel();
    });
  });
}

function setTrkFeedback(msg) {
  const el = document.getElementById("trkMsg");
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => {
    el.textContent = "";
  }, 2600);
}

function renderTrk() {
  const o = items.filter(isOpen).length;
  const l = items.filter(isLate).length;
  const hi = items.filter((x) => isOpen(x) && x.risk === "高").length;
  document.getElementById("trkStats").innerHTML = `
    <div class="card"><b>${items.length}</b>缺失總數</div>
    <div class="card"><b>${o}</b>未結案</div>
    <div class="card"><b>${hi}</b>高風險未結案</div>
    <div class="card card-overdue"><b>${l}</b>逾期</div>
  `;

  const fl = document.getElementById("flt").value;
  const list = items.filter((x) => (fl === "open" ? isOpen(x) : fl === "late" ? isLate(x) : true));
  document.getElementById("trkBody").innerHTML = list.map((x) => {
    const idx = items.indexOf(x);
    const opts = ST.map((s) => `<option${s === x.st ? " selected" : ""}>${esc(s)}</option>`).join("");
    const lateTag = isLate(x) ? ` ${chip("bad", "逾期")}` : "";
    return `
      <tr${isLate(x) ? ' class="late"' : ""}>
        <td>${esc(x.id)}</td>
        <td>${esc(x.src)}</td>
        <td>${esc(x.sys)}</td>
        <td>${esc(x.sum)}</td>
        <td>${chip(R[x.risk], x.risk)}</td>
        <td>${esc(x.own)}</td>
        <td>${f(new Date(x.due))}${lateTag}</td>
        <td><select data-sel="${idx}" aria-label="狀態">${opts}</select></td>
        <td><button type="button" class="act" data-upd="${idx}">更新</button></td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="9">沒有符合條件的缺失。</td></tr>';
}

function applyRowUpdate(idx) {
  const sel = document.querySelector(`select[data-sel="${idx}"]`);
  if (!sel) return;
  const prev = items[idx].st;
  const next = sel.value;
  items[idx].st = next;
  renderTrk();
  renderReport();
  renderHomeIntel();
  saveState();
  setTrkFeedback(`已更新 ${items[idx].id} 狀態：${prev} → ${next}`);
  addAuditLog(`更新缺失 ${items[idx].id} 狀態為「${next}」（原：${prev}）`);
}

document.getElementById("trkBody").addEventListener("change", (e) => {
  const sel = e.target.closest("select[data-sel]");
  if (!sel) return;
  applyRowUpdate(Number(sel.dataset.sel));
});

document.getElementById("trkBody").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-upd]");
  if (!btn) return;
  applyRowUpdate(Number(btn.dataset.upd));
});

document.getElementById("saveAllBtn").addEventListener("click", () => {
  document.querySelectorAll("select[data-sel]").forEach((sel) => {
    const idx = Number(sel.dataset.sel);
    items[idx].st = sel.value;
  });
  renderTrk();
  renderReport();
  renderHomeIntel();
  saveState();
  setTrkFeedback("已儲存目前缺失追蹤狀態與統計");
  addAuditLog("批次儲存缺失追蹤狀態與統計資料");
});

document.getElementById("resetDemoBtn").addEventListener("click", () => {
  items = defaultItems();
  checks = defaultChecks();
  accRows.forEach((r) => { r.checked = false; });
  drillRows[0].retrain = "已完成";
  drillRows[1].retrain = "免補訓";
  drillRows[2].retrain = "補訓追蹤中";
  try {
    localStorage.removeItem("secAuditSimStateV2");
  } catch (e) {}
  renderTrk();
  renderCal();
  renderReport();
  renderPrac();
  renderHomeIntel();
  addAuditLog("重設所有假設示範資料為初始狀態");
  setTrkFeedback("已還原初始假設示範資料");
});

document.getElementById("flt").addEventListener("change", renderTrk);

document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const risk = d.get("risk");
  const newId = `F-${String(items.length + 1).padStart(3, "0")}`;
  const sumText = d.get("sum").trim();
  if (!sumText) return;
  items.push({
    id: newId,
    src: d.get("src"),
    sys: d.get("sys"),
    sum: sumText,
    risk,
    own: d.get("own"),
    due: ad(T, DD[risk]),
    st: "待修補"
  });
  e.target.querySelector('[name="sum"]').value = "";
  renderTrk();
  renderReport();
  renderHomeIntel();
  saveState();
  setTrkFeedback(`已新增缺失 ${newId}`);
  addAuditLog(`新增缺失 ${newId}（${risk}風險／${d.get("own")}）：${sumText}`);
});

/* Role report + dashboard + export */
let curRole = "mgr";
const roleNames = {
  mgr: "直屬主管／Sam",
  infra: "Infra／系統維運部門",
  dev: "開發／App 團隊",
  ext: "外部顧問／委外廠商或相關窗口"
};

document.getElementById("roleBtns").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-role]");
  if (!b) return;
  curRole = b.dataset.role;
  document.querySelectorAll("#roleBtns button").forEach((x) => {
    x.setAttribute("aria-pressed", x === b ? "true" : "false");
  });
  renderReport();
});

document.getElementById("rptPeriod").addEventListener("change", renderReport);
document.getElementById("genBtn").addEventListener("click", () => {
  renderReport();
  addAuditLog(`重新產出「${roleNames[curRole]}」彙報草稿`);
});

function buildDashboardSvgMarkup(openItems, lateItems, calSoon, calLate) {
  const closedCount = items.length - openItems.length;
  const highOpenCount = openItems.filter((x) => x.risk === "高").length;
  const ownCounts = ["Infra", "應用開發", "行動開發", "資安"].map((name) => ({
    name,
    count: openItems.filter((x) => x.own === name).length
  }));
  const maxVal = Math.max(1, ...ownCounts.map((o) => o.count), openItems.length, closedCount, calSoon.length + calLate.length);
  const barW = (n) => Math.max(6, Math.round((n / maxVal) * 145));

  const bars = [
    { label: "未結案缺失", val: openItems.length, fill: "#d81b60" },
    { label: "已結案／通過", val: closedCount, fill: "#1f6f54" },
    { label: "已逾期缺失", val: lateItems.length, fill: "#a81148" },
    { label: "近期查核到期", val: calSoon.length + calLate.length, fill: "#9a5b13" }
  ];

  const barRows = bars.map((b, idx) => {
    const y = 26 + idx * 22;
    const w = b.val === 0 ? 3 : barW(b.val);
    return `
      <text x="8" y="${y + 11}" font-size="10.5" fill="#18181b">${b.label}</text>
      <rect x="86" y="${y}" width="${w}" height="13" rx="3" fill="${b.fill}"/>
      <text x="${92 + w}" y="${y + 11}" font-size="10.5" font-weight="700" fill="#18181b">${b.val}</text>
    `;
  }).join("");

  const ownRows = ownCounts.map((o, idx) => {
    const y = 134 + idx * 20;
    const w = o.count === 0 ? 3 : barW(o.count);
    return `
      <text x="8" y="${y + 10}" font-size="10" fill="#64646d">${o.name}</text>
      <rect x="86" y="${y}" width="${w}" height="11" rx="3" fill="#3b5998"/>
      <text x="${92 + w}" y="${y + 10}" font-size="10" fill="#18181b">${o.count}</text>
    `;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 268 222" width="536" height="444">
      <rect x="0" y="0" width="268" height="222" rx="8" fill="#ffffff" stroke="#e4e4e7"/>
      <text x="8" y="16" font-size="11" font-weight="700" fill="#a81148">態勢儀表板（高風險未結案：${highOpenCount}）</text>
      ${barRows}
      <line x1="8" y1="118" x2="260" y2="118" stroke="#e4e4e7"/>
      <text x="8" y="128" font-size="10.5" font-weight="700" fill="#64646d">各單位未結案分布</text>
      ${ownRows}
    </svg>
  `.trim();
}

function svgToPngDataUrl(svgMarkup) {
  return new Promise((resolve) => {
    const base64 = btoa(unescape(encodeURIComponent(svgMarkup)));
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 536;
        canvas.height = 444;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function renderChart(openItems, lateItems, calSoon, calLate) {
  const closedCount = items.length - openItems.length;
  const svgMarkup = buildDashboardSvgMarkup(openItems, lateItems, calSoon, calLate);
  document.getElementById("rptChart").innerHTML = `
    <h3 style="margin-bottom:6px;font-size:.92rem">態勢儀表板（假設模擬）</h3>
    <div class="dash-kpis">
      <div class="dash-kpi"><strong>${openItems.length}</strong><span>未結案</span></div>
      <div class="dash-kpi"><strong style="color:#a81148">${lateItems.length}</strong><span>已逾期</span></div>
      <div class="dash-kpi"><strong>${closedCount}</strong><span>已結案</span></div>
    </div>
    ${svgMarkup}
  `;
}

function renderReport() {
  const period = document.getElementById("rptPeriod").value;
  const openItems = items.filter(isOpen);
  const lateItems = items.filter(isLate);
  const calRows = checks.map((x) => ({ x, d: due(x), s: stat(x) }));
  const calLate = calRows.filter((r) => r.s.k === 0);
  const calSoon = calRows.filter((r) => r.s.k === 1);

  renderChart(openItems, lateItems, calSoon, calLate);

  const lines = [];
  lines.push(`【${period}｜對象：${roleNames[curRole]}｜操作者：${currentActor()}｜日期：${f(T)}】`);
  lines.push("（註：以下為假設工作情境之示範彙報／追蹤草稿）");
  lines.push("");

  if (curRole === "mgr") {
    lines.push("一、整體態勢摘要");
    lines.push(`- 核心查核共 ${checks.length} 項：已逾期 ${calLate.length} 項、60 天內到期 ${calSoon.length} 項。`);
    lines.push(`- 缺失追蹤共 ${items.length} 筆：未結案 ${openItems.length} 筆、已逾期 ${lateItems.length} 筆。`);
    lines.push("");
    lines.push("二、需主管關注與決策事項（假設情境）");
    lateItems.forEach((x) => {
      lines.push(`- [${x.id}／${x.risk}風險] ${x.sys}（負責：${x.own}）：${x.sum}（期限 ${f(new Date(x.due))}，狀態：${x.st}）`);
    });
    calSoon.slice(0, 3).forEach((r) => {
      lines.push(`- [週期到期提醒] ${r.x.n}（${r.x.c}）：下次期限 ${f(r.d)}（${r.s.t}）`);
    });
    lines.push("");
    lines.push("三、下一步推進計畫");
    lines.push("- 針對逾期與高風險缺失逐一對齊負責窗口修補時程，並確認待複測項目完成驗證留存。");
  } else if (curRole === "infra") {
    const infItems = openItems.filter((x) => x.own === "Infra");
    lines.push("一、Infra 維運與設定追蹤項目（假設情境）");
    if (infItems.length) {
      infItems.forEach((x) => {
        lines.push(`- ${x.id}（${x.sys}，${x.risk}風險）：${x.sum}｜期限：${f(new Date(x.due))}｜目前狀態：${x.st}`);
      });
    } else {
      lines.push("- 目前示範清單中無 Infra 未結案缺失。");
    }
    lines.push("");
    lines.push("二、需協助確認與留存之證據");
    lines.push("- 帳號權限適切性審查之清冊與設定確認紀錄。");
    lines.push("- 稽核日誌留存與定期檢視紀錄之確認窗口與留存路徑。");
  } else if (curRole === "dev") {
    const devItems = openItems.filter((x) => x.own === "應用開發" || x.own === "行動開發");
    lines.push("一、開發與 App 端待追蹤項目（假設情境）");
    if (devItems.length) {
      devItems.forEach((x) => {
        lines.push(`- ${x.id}（${x.own}／${x.sys}，${x.risk}風險）：${x.sum}｜期限：${f(new Date(x.due))}｜目前狀態：${x.st}`);
      });
    } else {
      lines.push("- 目前示範清單中無開發／App 未結案缺失。");
    }
    lines.push("");
    lines.push("二、修補與複測對齊事項");
    lines.push("- 請提供修補前後比對說明或測試結果，以便安排複測與更新缺失狀態。");
    lines.push("- 若涉及發版排程或第三方元件更新，請同步預計完成日。");
  } else {
    lines.push("一、外部顧問／委外廠商或相關窗口對齊重點（假設情境）");
    lines.push(`- 盤點近期到期之查核／健診／演練時程（60 天內到期共 ${calSoon.length} 項），確認各方分工與交付時間。`);
    lines.push("- 確認委外服務或顧問輔導產出文件之版本、審查意見與待補件項目。");
    lines.push("- 留存溝通紀錄與改善佐證，利於後續內稽、外部驗證或主管機關查核備查。");
  }

  document.getElementById("rptOut").value = lines.join("\n");
}

function getCurrentDashboardSvg() {
  const openItems = items.filter(isOpen);
  const lateItems = items.filter(isLate);
  const calRows = checks.map((x) => ({ x, d: due(x), s: stat(x) }));
  const calLate = calRows.filter((r) => r.s.k === 0);
  const calSoon = calRows.filter((r) => r.s.k === 1);
  return buildDashboardSvgMarkup(openItems, lateItems, calSoon, calLate);
}

function showCopyMsg(text) {
  const msg = document.getElementById("copyMsg");
  msg.textContent = text;
  setTimeout(() => {
    msg.textContent = "";
  }, 2400);
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const txt = document.getElementById("rptOut").value;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(() => {
      showCopyMsg("已複製到剪貼簿");
      addAuditLog(`複製「${roleNames[curRole]}」彙報草稿`);
    }).catch(() => {
      showCopyMsg("請手動選取文字複製");
    });
  } else {
    showCopyMsg("請手動選取文字複製");
  }
});

document.getElementById("docBtn").addEventListener("click", async () => {
  const txt = document.getElementById("rptOut").value;
  const bodyHtml = esc(txt).replace(/\n/g, "<br>");
  const imgSrc = await svgToPngDataUrl(getCurrentDashboardSvg());
  const wordDoc = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>資安查核與彙報工作台</title></head>
    <body style="font-family:'Microsoft JhengHei','Noto Sans TC',sans-serif;font-size:11pt;line-height:1.6;">
      <h3 style="color:#a81148;">態勢儀表板圖示</h3>
      <p><img src="${imgSrc}" width="320" alt="態勢儀表板圖示"></p>
      <hr>
      <p>${bodyHtml}</p>
    </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", wordDoc], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `彙報追蹤_${roleNames[curRole]}_${f(T)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showCopyMsg("已下載含儀表板圖示的 Word (.doc)");
  addAuditLog(`匯出含儀表板圖示的 Word 檔（${roleNames[curRole]}）`);
});

document.getElementById("pdfBtn").addEventListener("click", async () => {
  const txt = document.getElementById("rptOut").value;
  const imgSrc = await svgToPngDataUrl(getCurrentDashboardSvg());
  let sheet = document.getElementById("printReportSheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "printReportSheet";
    sheet.className = "print-report-sheet";
    document.body.appendChild(sheet);
  }
  sheet.innerHTML = `
    <h2>資安查核與彙報工作台（含態勢儀表板）</h2>
    <img id="printDashImg" src="${imgSrc}" width="300" alt="態勢儀表板圖示">
    <pre>${esc(txt)}</pre>
  `;
  const imgEl = document.getElementById("printDashImg");
  if (imgEl && imgEl.decode) {
    try {
      await imgEl.decode();
    } catch (e) {}
  }
  showCopyMsg("請在列印視窗選擇「另存為 PDF」");
  addAuditLog(`開啟含儀表板圖示的 PDF 列印視窗（${roleNames[curRole]}）`);
  setTimeout(() => {
    window.print();
  }, 150);
});

/* Local storage state persistence */
function saveState() {
  try {
    localStorage.setItem("secAuditSimStateV2", JSON.stringify({
      items,
      checks,
      auditLogs,
      userIdx
    }));
  } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem("secAuditSimStateV2");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.items) && parsed.items.length) {
      items = parsed.items.map((x) => ({ ...x, due: new Date(x.due) }));
    }
    if (Array.isArray(parsed.checks) && parsed.checks.length) {
      checks = parsed.checks.map((x) => ({
        ...x,
        last: x.last ? new Date(x.last) : undefined,
        due: x.due ? new Date(x.due) : undefined
      }));
    }
    if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length) {
      auditLogs = parsed.auditLogs;
    }
    if (typeof parsed.userIdx === "number" && mockUsers[parsed.userIdx]) {
      userIdx = parsed.userIdx;
    }
  } catch (e) {}
}

loadState();
renderUserPanel();
renderHomeIntel();

const initView = (location.hash || "").slice(1);
if (["home", "prac_trk", "rpt", "cal", "src"].includes(initView)) {
  switchView(initView);
} else {
  switchView("home");
}

renderAuditViews();
renderPrac();
renderCal();
renderTrk();
renderReport();