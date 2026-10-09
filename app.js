/* =====================================================================
   Little Bites — app logic
   - Tabs, food list, allergen schedule
   - Day 1/2/3 checklist that timestamps each check (+ who did it)
   - Saves to localStorage immediately, and syncs to a Google Sheet
     via a Google Apps Script Web App URL (set in Setup).
   ===================================================================== */

const LS_KEY = "littleBites.v1";

const DEFAULT_STATE = {
  baby: { name:"Baby", parents:["Parent 1","Parent 2"] },
  activeParent: "Parent 1",
  // intros: one entry per food/allergen you're currently working through
  intros: [],          // {id,label,emoji,isAllergen,startedISO,days:[{day,items:[{id,text}]}],checks:{...},reactions:{}}
  activeIntroId: null,
  activeDay: 1,
  cloud: { url:"", lastSync:"" },
  settings: { disclaimerDismissed:false }
};

let S = loadLocal();

/* ---------------- persistence ---------------- */
function loadLocal(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), JSON.parse(raw));
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}
function saveLocal(){
  localStorage.setItem(LS_KEY, JSON.stringify(S));
  document.getElementById("lastSaved").textContent =
    "saved " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
async function save(){
  saveLocal();
  if(S.cloud.url){ await cloudPush(); }
}

/* ---------------- cloud (Google Sheets via Apps Script) ---------------- */
function setSyncLabel(state, ok){
  const el = document.getElementById("syncState");
  const chip = document.getElementById("syncBtn");
  el.textContent = state;
  chip.classList.toggle("ok", !!ok);
}
async function cloudPush(){
  if(!S.cloud.url) return;
  try{
    setSyncLabel("Saving…");
    await fetch(S.cloud.url, {
      method:"POST",
      // Apps Script web apps accept text/plain without a CORS preflight
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body: JSON.stringify({ action:"save", data:S })
    });
    S.cloud.lastSync = new Date().toISOString();
    saveLocal();
    setSyncLabel("Synced ✓", true);
  }catch(e){
    setSyncLabel("Sync failed");
    toast("Could not reach your Google Sheet. Saved on this device.");
  }
}
async function cloudPull(){
  if(!S.cloud.url){ toast("Add your Google Sheet link in Setup first."); return; }
  try{
    setSyncLabel("Loading…");
    const res = await fetch(S.cloud.url + "?action=load", { method:"GET" });
    const json = await res.json();
    if(json && json.data){
      const url = S.cloud.url;        // keep this device's link
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), json.data);
      S.cloud.url = url;
      saveLocal();
      render();
      setSyncLabel("Synced ✓", true);
      toast("Loaded your saved data from Google Sheets.");
    }else{
      setSyncLabel("Connected", true);
      toast("Connected — no saved data in the Sheet yet.");
    }
  }catch(e){
    setSyncLabel("Load failed");
    toast("Could not load from your Google Sheet. Check the link in Setup.");
  }
}

/* ---------------- helpers ---------------- */
function stampNow(){ return new Date().toISOString(); }
function fmtStamp(iso){
  if(!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
}
function toast(msg){
  let t = document.querySelector(".toast");
  if(!t){ t = document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), 2600);
}
function activeIntro(){ return S.intros.find(i=>i.id===S.activeIntroId) || null; }

/* ---------------- intros ---------------- */
function startIntro(label, emoji, isAllergen){
  const id = "i_" + Date.now();
  S.intros.push({
    id, label, emoji, isAllergen,
    startedISO: stampNow(),
    days: makeIntroDays(label),
    checks: {},       // key = `${day}:${itemId}` -> {at, by}
    reactions: {},    // key = day -> {at, by, text}
    introduced: false
  });
  S.activeIntroId = id;
  S.activeDay = 1;
  save(); render();
  toast(`Started ${label} — Day 1`);
}
function toggleCheck(day, itemId){
  const it = activeIntro(); if(!it) return;
  const key = `${day}:${itemId}`;
  if(it.checks[key]){ delete it.checks[key]; }
  else { it.checks[key] = { at: stampNow(), by: S.activeParent }; }
  // auto-complete flag
  const d3done = it.checks[`3:d3-done`];
  it.introduced = !!d3done;
  save(); render();
}
function logReaction(day){
  const it = activeIntro(); if(!it) return;
  const txt = prompt("Describe what you noticed (symptoms, timing). This is a note for you and your doctor:");
  if(txt===null) return;
  it.reactions[day] = { at: stampNow(), by: S.activeParent, text: txt.trim() };
  save(); render();
  toast("Reaction note saved with a timestamp.");
}

/* ---------------- rendering ---------------- */
const main = document.getElementById("main");
let currentTab = "plan";

function render(){
  document.getElementById("babyNameFoot").textContent = S.baby.name || "Baby";
  // disclaimer
  document.getElementById("disclaimer").classList.toggle("hide", S.settings.disclaimerDismissed);
  // sync chip baseline
  if(S.cloud.url && document.getElementById("syncState").textContent==="Local only")
    setSyncLabel("Connected", true);
  if(!S.cloud.url) setSyncLabel("Local only", false);

  if(currentTab==="plan") renderPlan();
  else if(currentTab==="foods") renderFoods();
  else if(currentTab==="allergens") renderAllergens();
  else if(currentTab==="log") renderLog();
  else if(currentTab==="settings") renderSettings();
}

function renderPlan(){
  const it = activeIntro();
  let html = "";

  // parent switch + start new
  html += `<div class="card">
    <div class="dayhead">
      <div><h2 style="margin:0">Daily Plan</h2><span class="muted">Checklist with timestamps</span></div>
      <select id="parentSel" style="width:auto">
        ${S.baby.parents.map(p=>`<option ${p===S.activeParent?"selected":""}>${esc(p)}</option>`).join("")}
      </select>
    </div>
    <div class="muted" style="margin-bottom:8px">Logging as the person selected above — each check records who & when.</div>
    <button class="btn sec small" id="newIntroBtn">➕ Start a new food / allergen</button>
  </div>`;

  if(!it){
    html += `<div class="card"><p>No food in progress yet. Tap <b>Start a new food / allergen</b>, or pick one from the <b>Foods</b> or <b>Allergens</b> tab.</p></div>`;
    main.innerHTML = html; wirePlan(); return;
  }

  // which intro + day selector
  html += `<div class="card">
    <div class="dayhead">
      <div><h3>${it.emoji} ${esc(it.label)} ${it.isAllergen?'<span class="pill allergen">allergen</span>':''}</h3>
        <span class="muted">Started ${fmtStamp(it.startedISO)}${it.introduced?' · <b style="color:var(--green-d)">Introduced ✓</b>':''}</span></div>
    </div>
    <div class="daysel">
      ${it.days.map(d=>{
        const total=d.items.length, done=d.items.filter(x=>it.checks[`${d.day}:${x.id}`]).length;
        const cls = (S.activeDay===d.day?"active ":"") + (done===total?"done":"");
        return `<div class="daychip ${cls}" data-day="${d.day}">Day ${d.day}<small>${done}/${total}</small></div>`;
      }).join("")}
    </div>
  </div>`;

  // the checklist for active day
  const d = it.days.find(x=>x.day===S.activeDay) || it.days[0];
  html += `<div class="card"><h3>Day ${d.day} checklist</h3>`;
  d.items.forEach(item=>{
    const key = `${d.day}:${item.id}`;
    const c = it.checks[key];
    html += `<div class="check-row">
      <div class="check-box ${c?'on':''}" data-day="${d.day}" data-item="${item.id}">${c?'✓':''}</div>
      <div class="check-main">
        <div class="check-title">${esc(item.text)}</div>
        ${c?`<span class="stamp">✓ ${esc(c.by)} · ${fmtStamp(c.at)}</span>`:`<div class="check-meta">not checked yet</div>`}
      </div>
    </div>`;
  });
  // reaction
  const r = it.reactions[d.day];
  html += `<div class="react-note">
    ${r?`<span class="stamp react">⚠ reaction note · ${esc(r.by)} · ${fmtStamp(r.at)}</span><div class="note">${esc(r.text)||'(no text)'}</div>`:""}
    <button class="btn danger small" style="margin-top:8px" id="reactBtn">⚠️ Log a reaction / note</button>
  </div></div>`;

  // reaction reference
  html += `<div class="card"><details><summary>What a reaction can look like</summary>
    <ul class="steps">${REACTION_SIGNS.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
    <div class="note" style="border-color:#f3cfcf;background:#fdecec;color:#7a2f28">${esc(EMERGENCY_TEXT)}</div>
  </details></div>`;

  main.innerHTML = html; wirePlan();
}

function wirePlan(){
  const ps = document.getElementById("parentSel");
  if(ps) ps.onchange = ()=>{ S.activeParent = ps.value; saveLocal(); };
  const nb = document.getElementById("newIntroBtn");
  if(nb) nb.onclick = openNewIntro;
  document.querySelectorAll(".daychip").forEach(c=>c.onclick=()=>{ S.activeDay=+c.dataset.day; render(); });
  document.querySelectorAll(".check-box").forEach(b=>b.onclick=()=>toggleCheck(+b.dataset.day, b.dataset.item));
  const rb = document.getElementById("reactBtn");
  if(rb) rb.onclick = ()=>logReaction(S.activeDay);
}

function openNewIntro(){
  const foods = FOODS.map(f=>`${f.emoji} ${f.name}`);
  const alls  = ALLERGENS.map(a=>`${a.emoji} ${a.name} (allergen)`);
  const choice = prompt(
    "Type a number to start:\n\nFOODS:\n" +
    FOODS.map((f,i)=>`${i+1}. ${f.name}`).join("\n") +
    "\n\nALLERGENS:\n" +
    ALLERGENS.map((a,i)=>`${100+i+1}. ${a.name}`).join("\n") +
    "\n\n(or type your own food name)"
  );
  if(!choice) return;
  const n = parseInt(choice,10);
  if(n>=1 && n<=FOODS.length){ const f=FOODS[n-1]; startIntro(f.name,f.emoji,false); }
  else if(n>=101 && n-100<=ALLERGENS.length){ const a=ALLERGENS[n-101]; startIntro(a.name,a.emoji,true); }
  else { startIntro(choice.trim(), "🍽️", false); }
}

function renderFoods(){
  let html = `<div class="card"><h2>Recommended first foods</h2>
    <p class="muted">Around 6 months, once baby can sit with support and shows interest. Introduce one new food at a time and watch for a few days. Amounts are starting points — follow baby's hunger cues.</p></div>`;
  html += `<div class="card">`;
  FOODS.forEach(f=>{
    html += `<div class="food-item">
      <div class="food-name">${f.emoji} ${esc(f.name)} <span class="pill safe">${esc(f.stage)}</span></div>
      <div class="food-grid">
        <b>Cook</b><span>${esc(f.cook)}</span>
        <b>Temp</b><span>${esc(f.temp)}</span>
        <b>Texture</b><span>${esc(f.texture)}</span>
        <b>Amount</b><span>${esc(f.amount)}</span>
        <b>Tips</b><span>${esc(f.tips)}</span>
      </div>
      <button class="btn sec small" style="margin-top:8px" data-food="${esc(f.name)}" data-emoji="${f.emoji}">➕ Add to my plan</button>
    </div>`;
  });
  html += `</div>`;
  html += `<div class="note">🥄 <b>Choking safety:</b> no honey before 12 months, no whole nuts/grapes/hard chunks, no cow's milk as a drink before 12 months, no added salt or sugar. Always supervise, and keep baby upright while eating.</div>`;
  main.innerHTML = html;
  document.querySelectorAll("[data-food]").forEach(b=>b.onclick=()=>{
    startIntro(b.dataset.food, b.dataset.emoji, false); currentTab="plan"; setActiveTab(); render();
  });
}

function renderAllergens(){
  let html = `<div class="card"><h2>Allergen introduction schedule</h2>
    <p class="muted">A common approach: introduce one allergen at a time, early, in the morning, on a day you can watch baby for a few hours. Wait ~3–5 days before the next NEW allergen. Once tolerated, keep offering it a few times a week.</p>
    <div class="note" style="border-color:#f3cfcf;background:#fdecec;color:#7a2f28"><b>Confirm this order & timing with your pediatrician</b>, especially if there's family history of allergies or your baby has eczema — peanut and egg sometimes need testing first.</div>
  </div>`;
  html += `<div class="card">`;
  ALLERGENS.forEach(a=>{
    html += `<div class="food-item">
      <div class="food-name">${a.emoji} ${esc(a.name)} <span class="pill allergen">Suggested step ${a.week}</span></div>
      <div class="food-grid">
        <b>How</b><span>${esc(a.how)}</span>
        <b>Amount</b><span>${esc(a.amount)}</span>
        <b>Watch</b><span>${esc(a.watch)}</span>
        <b>Note</b><span>${esc(a.note)}</span>
      </div>
      <button class="btn sec small" style="margin-top:8px" data-all="${esc(a.name)}" data-emoji="${a.emoji}">➕ Start this allergen (3-day watch)</button>
    </div>`;
  });
  html += `</div>`;
  main.innerHTML = html;
  document.querySelectorAll("[data-all]").forEach(b=>b.onclick=()=>{
    startIntro(b.dataset.all, b.dataset.emoji, true); currentTab="plan"; setActiveTab(); render();
  });
}

function renderLog(){
  let html = `<div class="card"><h2>History log</h2><p class="muted">Everything you've checked off, newest first — with the timestamp and who did it.</p></div>`;
  const rows = [];
  S.intros.forEach(it=>{
    Object.entries(it.checks).forEach(([key,c])=>{
      const [day,itemId] = key.split(":");
      const dayObj = it.days.find(d=>d.day==day);
      const item = dayObj && dayObj.items.find(x=>x.id===itemId);
      rows.push({ at:c.at, by:c.by, label:it.label, emoji:it.emoji, day,
                  text:item?item.text:itemId, react:false });
    });
    Object.entries(it.reactions).forEach(([day,r])=>{
      rows.push({ at:r.at, by:r.by, label:it.label, emoji:it.emoji, day,
                  text:"⚠ Reaction note: "+(r.text||""), react:true });
    });
  });
  rows.sort((a,b)=> (b.at||"").localeCompare(a.at||""));
  if(!rows.length){ html += `<div class="card"><p class="muted">Nothing logged yet.</p></div>`; }
  else{
    html += `<div class="card">`;
    rows.forEach(r=>{
      html += `<div class="check-row">
        <div class="check-main">
          <div class="check-title">${r.emoji} ${esc(r.label)} — Day ${r.day}</div>
          <div class="check-meta">${esc(r.text)}</div>
          <span class="stamp ${r.react?'react':''}">${esc(r.by)} · ${fmtStamp(r.at)}</span>
        </div></div>`;
    });
    html += `</div>`;
  }
  main.innerHTML = html;
}

function renderSettings(){
  const url = S.cloud.url || "";
  let html = `<div class="card"><h2>Baby & parents</h2>
    <label>Baby's name</label>
    <input id="babyName" value="${esc(S.baby.name)}">
    <label>Parent / caregiver names (comma separated)</label>
    <input id="parentsIn" value="${esc(S.baby.parents.join(", "))}">
    <button class="btn small" style="margin-top:10px" id="saveProfile">Save</button>
  </div>`;

  html += `<div class="card"><h2>☁️ Save to Google Sheets</h2>
    <p class="muted">Your progress saves on this device automatically. To sync it across phones (so you and your partner share one plan), paste your Google Sheet's link below. Follow the one-time setup steps underneath — it takes about 5 minutes.</p>
    <label>Your Apps Script Web App link</label>
    <input id="cloudUrl" placeholder="https://script.google.com/macros/s/..../exec" value="${esc(url)}">
    <div class="row" style="margin-top:10px">
      <button class="btn small" id="saveCloud">Connect</button>
      <button class="btn sec small" id="pullCloud">⬇️ Load from Sheet</button>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn sec small" id="pushCloud">⬆️ Save to Sheet now</button>
    </div>
    <p class="muted" style="margin-top:8px">Last sync: ${S.cloud.lastSync?fmtStamp(S.cloud.lastSync):"never"}</p>

    <details style="margin-top:10px"><summary>📋 One-time setup steps (click to open)</summary>
      <ol class="steps">
        <li>Go to <code>sheets.google.com</code> and create a <b>new blank spreadsheet</b>. Name it e.g. "Baby Solids".</li>
        <li>In the menu, click <b>Extensions → Apps Script</b>. A code editor opens.</li>
        <li>Delete whatever is there, and paste in the script from the <code>google-apps-script.gs</code> file I made (open the Setup Guide for the exact code).</li>
        <li>Click <b>Deploy → New deployment</b>. For type choose <b>Web app</b>.</li>
        <li>Set <b>Execute as: Me</b> and <b>Who has access: Anyone</b>. Click <b>Deploy</b> and authorize when asked.</li>
        <li>Copy the <b>Web app URL</b> it gives you (ends in <code>/exec</code>) and paste it in the box above, then tap <b>Connect</b>.</li>
        <li>Do this once per family — both phones paste the <b>same</b> link to share the plan.</li>
      </ol>
      <div class="note">The full copy-paste code and screenshots-style walkthrough are in <code>SETUP-GUIDE.html</code> in your app folder.</div>
    </details>
  </div>`;

  html += `<div class="card"><h2>Data</h2>
    <button class="btn sec small" id="exportBtn">⬇️ Export my data (backup file)</button>
    <button class="btn danger small" style="margin-top:8px" id="resetBtn">Reset everything</button>
  </div>`;

  main.innerHTML = html;

  document.getElementById("saveProfile").onclick = ()=>{
    S.baby.name = document.getElementById("babyName").value.trim() || "Baby";
    S.baby.parents = document.getElementById("parentsIn").value.split(",").map(s=>s.trim()).filter(Boolean);
    if(!S.baby.parents.length) S.baby.parents=["Parent 1"];
    if(!S.baby.parents.includes(S.activeParent)) S.activeParent = S.baby.parents[0];
    save(); toast("Saved"); render();
  };
  document.getElementById("saveCloud").onclick = async ()=>{
    S.cloud.url = document.getElementById("cloudUrl").value.trim();
    saveLocal();
    if(S.cloud.url){ setSyncLabel("Connecting…"); await cloudPush(); toast("Connected to your Google Sheet."); }
    else { setSyncLabel("Local only", false); }
    render();
  };
  document.getElementById("pullCloud").onclick = cloudPull;
  document.getElementById("pushCloud").onclick = async ()=>{ await cloudPush(); toast("Saved to Sheet."); };
  document.getElementById("exportBtn").onclick = ()=>{
    const blob = new Blob([JSON.stringify(S,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "baby-solids-backup.json"; a.click();
  };
  document.getElementById("resetBtn").onclick = ()=>{
    if(confirm("Erase all tracked data on this device? (Your Google Sheet copy stays unless you overwrite it.)")){
      S = JSON.parse(JSON.stringify(DEFAULT_STATE)); saveLocal(); render(); toast("Reset.");
    }
  };
}

/* ---------------- tabs & boot ---------------- */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, m=>(
  {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
function setActiveTab(){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===currentTab));
}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{ currentTab=t.dataset.tab; setActiveTab(); render(); });
document.getElementById("dismissDisc").onclick = ()=>{ S.settings.disclaimerDismissed=true; saveLocal(); render(); };
document.getElementById("syncBtn").onclick = ()=>{ currentTab="settings"; setActiveTab(); render(); };

render();
// if a cloud link exists, try to load the latest on startup
if(S.cloud.url){ cloudPull(); }
