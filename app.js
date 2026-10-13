/* =====================================================================
   Little Bites — app logic (v2)
   WEEK-BASED calendar plan + meal planner, Fridge/Pantry suggestions,
   summarized log, "try next by food group", nutrition facts + filter.
   Keeps: timestamped checks (who & when), Google Sheets sync.
   ===================================================================== */

const LS_KEY = "littleBites.v1";   // same key; we migrate old shape in-place

const DEFAULT_STATE = {
  v: 2,
  baby: { name:"Baby", parents:["Parent 1","Parent 2"] },
  activeParent: "Parent 1",
  startDateISO: todayISO(),         // Monday-anchored week 1 start
  weeks: [],                        // [{n, foods:[name...], intros:{name:{days,checks,reactions,introduced,emoji,isAllergen,startedISO}}}]
  activeWeek: 1,
  pantry: [],                       // raw ingredient strings the user typed
  cloud: { url:"", lastSync:"" },
  settings: { disclaimerDismissed:false }
};

let S = loadLocal();
migrate();

/* ---------------- date helpers ---------------- */
function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function mondayOf(iso){
  const d = new Date(iso); const dow = (d.getDay()+6)%7; // 0=Mon
  d.setDate(d.getDate()-dow); d.setHours(0,0,0,0); return d;
}
function weekStart(n){ const m = mondayOf(S.startDateISO); m.setDate(m.getDate()+(n-1)*7); return m; }
function weekRangeLabel(n){
  const s = weekStart(n); const e = new Date(s); e.setDate(e.getDate()+6);
  const f = d=>d.toLocaleDateString([], {month:"short",day:"numeric"});
  return `${f(s)} – ${f(e)}`;
}
function dayDate(weekN, dayN){ const s = weekStart(weekN); const d=new Date(s); d.setDate(d.getDate()+(dayN-1)); return d; }
function dayLabel(weekN, dayN){ return dayDate(weekN,dayN).toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}); }

/* ---------------- migration from v1 ---------------- */
function migrate(){
  if(S.v === 2) { ensureWeek(1); normalizeState(); return; }
  // v1 had S.intros (flat list). Fold them into Week 1.
  const old = S.intros || [];
  S.v = 2;
  if(!S.startDateISO) S.startDateISO = todayISO();
  S.weeks = S.weeks || [];
  ensureWeek(1);
  old.forEach(it=>{
    if(!it || !it.label) return;
    const wk = S.weeks[0];
    wk.foods = wk.foods || [];
    if(!wk.foods.includes(it.label)) wk.foods.push(it.label);
    wk.intros[it.label] = {
      emoji: it.emoji, isAllergen: it.isAllergen, startedISO: it.startedISO,
      days: it.days || makeIntroDays(it.label),
      checks: it.checks || {}, reactions: it.reactions || {}, introduced: !!it.introduced
    };
  });
  delete S.intros; delete S.activeIntroId; delete S.activeDay;
  S.activeWeek = 1;
  normalizeState();
  saveLocal();
}
/* Repair any week/intro so render() can never throw on old or cloud-loaded data. */
function normalizeState(){
  if(!Array.isArray(S.weeks)) S.weeks = [];
  if(!S.startDateISO) S.startDateISO = todayISO();
  if(!S.baby) S.baby = { name:"Baby", parents:["Parent 1","Parent 2"] };
  if(!Array.isArray(S.baby.parents) || !S.baby.parents.length) S.baby.parents = ["Parent 1","Parent 2"];
  if(!S.activeParent) S.activeParent = S.baby.parents[0];
  if(!Array.isArray(S.pantry)) S.pantry = [];
  if(!S.cloud) S.cloud = { url:"", lastSync:"" };
  if(!S.settings) S.settings = { disclaimerDismissed:false };
  S.weeks.forEach((w,i)=>{
    if(!w || typeof w!=="object"){ S.weeks[i] = { n:i+1, foods:[], intros:{} }; return; }
    w.n = i+1;
    if(!Array.isArray(w.foods)) w.foods = [];
    if(!w.intros || typeof w.intros!=="object") w.intros = {};
    Object.keys(w.intros).forEach(name=>{
      const it = w.intros[name];
      if(!it || typeof it!=="object"){ delete w.intros[name]; return; }
      if(!Array.isArray(it.days) || !it.days.length) it.days = makeIntroDays(name);
      it.days.forEach(d=>{ if(!Array.isArray(d.items)) d.items = []; if(typeof d.day!=="number") d.day = 1; });
      if(!it.checks || typeof it.checks!=="object") it.checks = {};
      if(!it.reactions || typeof it.reactions!=="object") it.reactions = {};
      it.emoji = it.emoji || "🍽️";
      it.introduced = !!it.introduced;
      // ensure every planned food has an intro entry
    });
    (w.foods||[]).forEach(nm=>{ if(!w.intros[nm]) w.intros[nm] = { emoji:"🍽️", isAllergen:false, startedISO:stampNow(), days:makeIntroDays(nm), checks:{}, reactions:{}, introduced:false }; });
  });
  if(!S.weeks.length) ensureWeek(1);
  if(typeof S.activeWeek!=="number" || S.activeWeek<1 || S.activeWeek>S.weeks.length) S.activeWeek = 1;
}
function ensureWeek(n){
  S.weeks = S.weeks || [];
  while(S.weeks.length < n){
    S.weeks.push({ n:S.weeks.length+1, foods:[], intros:{} });
  }
  return S.weeks[n-1];
}
function week(n){ return ensureWeek(n); }

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
  const el = document.getElementById("lastSaved");
  if(el) el.textContent = "saved " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}
async function save(){ saveLocal(); if(S.cloud.url){ await cloudPush(); } }

/* ---------------- cloud (Google Sheets via Apps Script) ---------------- */
function setSyncLabel(state, ok){
  const el = document.getElementById("syncState"); const chip = document.getElementById("syncBtn");
  if(el) el.textContent = state; if(chip) chip.classList.toggle("ok", !!ok);
}
async function cloudPush(){
  if(!S.cloud.url) return;
  try{
    setSyncLabel("Saving…");
    await fetch(S.cloud.url, { method:"POST",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body: JSON.stringify({ action:"save", data:S }) });
    S.cloud.lastSync = new Date().toISOString(); saveLocal(); setSyncLabel("Synced ✓", true);
  }catch(e){ setSyncLabel("Sync failed"); toast("Could not reach your Google Sheet. Saved on this device."); }
}
async function cloudPull(){
  if(!S.cloud.url){ toast("Add your Google Sheet link in Setup first."); return; }
  try{
    setSyncLabel("Loading…");
    const res = await fetch(S.cloud.url + "?action=load", { method:"GET" });
    const json = await res.json();
    if(json && json.data){
      const url = S.cloud.url;
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), json.data);
      S.cloud.url = url; migrate(); normalizeState(); saveLocal(); render();
      setSyncLabel("Synced ✓", true); toast("Loaded your saved data from Google Sheets.");
    } else { setSyncLabel("Connected", true); toast("Connected — no saved data in the Sheet yet."); }
  }catch(e){
    setSyncLabel("Load issue");
    console.error("cloudPull error:", e);
    // Don't leave the app in a half-loaded state: repair and re-render so taps work.
    try{ normalizeState(); render(); }catch(_){}
    toast("Loaded, but had to repair the saved data. If anything looks off, tell us.");
  }
}

/* ---------------- small helpers ---------------- */
function stampNow(){ return new Date().toISOString(); }
function fmtStamp(iso){ if(!iso) return ""; return new Date(iso).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
function toast(msg){
  let t = document.querySelector(".toast");
  if(!t){ t = document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), 2600);
}
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

/* ---------------- modal / popup ---------------- */
function openModal(innerHtml, centered){
  closeModal();
  const bg = document.createElement("div");
  bg.className = "modal-bg" + (centered?" center":"");
  bg.id = "modalBg";
  bg.innerHTML = `<div class="modal"><button class="modal-close" id="modalClose">✕</button>${innerHtml}</div>`;
  document.body.appendChild(bg);
  bg.onclick = (e)=>{ if(e.target===bg) closeModal(); };
  document.getElementById("modalClose").onclick = closeModal;
  return bg;
}
function closeModal(){ const m=document.getElementById("modalBg"); if(m) m.remove(); }

/* popup: how to prep a food (same info as Foods tab) */
function showPrep(name){
  if(!it){
    openModal(`<h3>🍽️ ${esc(name)}</h3><p class="muted">This is a custom food you added, so there's no stored prep guide. General tips: cook until very soft, cool to lukewarm, purée or mash smooth, start with 1–2 teaspoons, and watch for any reaction.</p>`, true);
    return;
  }
  const nutr = (it.nutrients||[]).map(n=>`<span class="pill">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("");
  const rows = it.isAllergen
    ? `<b>How</b><span>${esc(it.how)}</span><b>Amount</b><span>${esc(it.amount)}</span><b>Watch</b><span>${esc(it.watch)}</span><b>Note</b><span>${esc(it.note)}</span>`
    : `<b>Cook</b><span>${esc(it.cook)}</span><b>Temp</b><span>${esc(it.temp)}</span><b>Texture</b><span>${esc(it.texture)}</span><b>Amount</b><span>${esc(it.amount)}</span><b>Tips</b><span>${esc(it.tips)}</span>`;
  openModal(`
    <h3>${it.emoji} ${esc(it.name)} ${it.isAllergen?'<span class="pill allergen">allergen</span>':`<span class="pill safe">${esc(it.group)}</span>`}</h3>
    <div style="margin:6px 0 10px">${nutr}</div>
    <div class="food-grid">${rows}</div>
    <div class="note" style="margin-top:12px">Educational guidance — confirm amounts & allergen timing with your pediatrician.</div>
  `, true);
}

/* popup: full Google Sheets cloud-saving tutorial (walkthrough + copy-paste code) */
const APPS_SCRIPT_CODE = `var SHEET_NAME = "Data";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1).setValue("littleBitesData");
  }
  return sh;
}

function doGet(e) {
  try {
    var sh = getSheet_();
    var cell = sh.getRange(2, 1).getValue();
    var data = cell ? JSON.parse(cell) : null;
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === "save") {
      var sh = getSheet_();
      sh.getRange(2, 1).setValue(JSON.stringify(body.data));
      sh.getRange(2, 2).setValue(new Date());
      return json_({ ok: true });
    }
    return json_({ ok: false, error: "unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

function showSetupTutorial(){
  const codeHtml = esc(APPS_SCRIPT_CODE);
  openModal(`
    <h3>📖 Set up cloud saving (Google Sheets)</h3>
    <p class="muted">Your app already saves on this phone. These one-time steps (~5 min, easiest on a computer) connect it to a Google Sheet so your plan syncs across both phones. You just need a free Google account.</p>
    <ol class="steps">
      <li><b>Create a spreadsheet.</b> Go to <code>sheets.google.com</code>, sign in, click <b>Blank spreadsheet</b>, name it e.g. "Baby Solids".</li>
      <li><b>Open the script editor.</b> In the menu: <b>Extensions &rarr; Apps Script</b>. A code box opens.</li>
      <li><b>Paste in the code.</b> Delete everything in the box, then paste the code below (use the Copy button).</li>
      <li><b>Save &amp; deploy.</b> Click <b>Deploy &rarr; New deployment</b>. Next to "Select type" click the gear and choose <b>Web app</b>.</li>
      <li><b>Set permissions.</b> <b>Execute as: Me</b> and <b>Who has access: Anyone</b>. Click <b>Deploy</b>.</li>
      <li><b>Authorize.</b> Click <b>Authorize access</b>, pick your account. If you see "Google hasn't verified this app" (normal for your own script), click <b>Advanced &rarr; Go to (your project) &rarr; Allow</b>.</li>
      <li><b>Copy the link.</b> It gives a <b>Web app URL</b> ending in <code>/exec</code>. Copy it.</li>
      <li><b>Paste it here.</b> Close this tutorial, paste the link into the box above, tap <b>Connect</b>. The cloud chip should read <b>Synced &#10003;</b>.</li>
      <li><b>Second phone.</b> Open this app there, Setup tab, paste the <b>same</b> link. Now you share one plan.</li>
    </ol>
    <div class="row" style="margin:4px 0 8px"><button class="btn small" id="copyCode">&#128203; Copy the code</button></div>
    <pre style="background:#2d2a24;color:#eee;padding:12px;border-radius:10px;overflow-x:auto;font-size:12px;line-height:1.4;white-space:pre">${codeHtml}</pre>
    <div class="note">The tips that matter most: Step 5 "Who has access: Anyone" (or the app can't reach it), and Step 6 (the "unverified" warning is expected). If sync later says "failed", re-check Step 5 under Deploy &rarr; Manage deployments.</div>
  `, true);
  const cb = document.getElementById("copyCode");
  if(cb) cb.onclick = ()=>{ navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(()=>{ cb.textContent="\u2713 Copied!"; }).catch(()=>{ toast("Press and hold the code to copy."); }); };
}

/* all food names ever added to any week */
function allPlannedFoods(){
  const set = new Set();
  S.weeks.forEach(w=> (w.foods||[]).forEach(f=>set.add(f)) );
  return [...set];
}
/* names of foods marked introduced (tolerated) anywhere */
function introducedFoods(){
  const out = [];
  S.weeks.forEach(w=> Object.entries(w.intros||{}).forEach(([name,it])=>{ if(it.introduced) out.push(name); }) );
  return out;
}
/* names of foods the baby has at least STARTED (any check logged) */
function startedFoods(){
  const out = [];
  S.weeks.forEach(w=> Object.entries(w.intros||{}).forEach(([name,it])=>{
    if(it.introduced || Object.keys(it.checks||{}).length) out.push(name);
  }) );
  return [...new Set(out)];
}
/* the groups the baby has tried — introduced OR started (so suggestions appear sooner) */
function triedGroups(){
  const groups = new Set();
  startedFoods().forEach(name=>{ const it=itemByName(name); if(it && it.group) groups.add(it.group); });
  return [...groups];
}

/* ---------------- plan / week ops ---------------- */
function addFoodToWeek(weekN, name, emoji, isAllergen){
  const w = week(weekN);
  if(!w.foods.includes(name)) w.foods.push(name);
  if(!w.intros[name]){
    w.intros[name] = { emoji: emoji||"🍽️", isAllergen: !!isAllergen, startedISO: stampNow(),
      days: makeIntroDays(name), checks:{}, reactions:{}, introduced:false };
  }
  save(); toast(`Added ${name} to Week ${weekN}`);
}
function removeFoodFromWeek(weekN, name){
  const w = week(weekN);
  w.foods = w.foods.filter(f=>f!==name);
  delete w.intros[name];
  save(); render();
}
function toggleCheck(weekN, name, day, itemId){
  const it = week(weekN).intros[name]; if(!it) return;
  const key = `${day}:${itemId}`;
  if(it.checks[key]) delete it.checks[key];
  else it.checks[key] = { at: stampNow(), by: S.activeParent };
  it.introduced = !!it.checks[`3:d3-done`];
  save(); render();
}
function markIntroduced(weekN, name){
  const it = week(weekN).intros[name]; if(!it) return;
  it.introduced = !it.introduced;
  // keep the Day-3 "done" check in sync so the two views agree
  if(it.introduced){ it.checks["3:d3-done"] = it.checks["3:d3-done"] || { at: stampNow(), by: S.activeParent }; }
  else { delete it.checks["3:d3-done"]; }
  save(); render();
  toast(it.introduced ? `${name} marked introduced ✓` : `${name} no longer marked introduced`);
}
function logReaction(weekN, name, day){
  const it = week(weekN).intros[name]; if(!it) return;
  const txt = prompt("Describe what you noticed (symptoms, timing). A note for you and your doctor:");
  if(txt===null) return;
  it.reactions[day] = { at: stampNow(), by: S.activeParent, text: txt.trim() };
  save(); render(); toast("Reaction note saved with a timestamp.");
}

/* ---- edit WHEN an activity happened (keeps an edited-at stamp) ---- */
function toLocalInput(iso){
  // yyyy-MM-ddThh:mm for <input type=datetime-local>, in local time
  const d = iso ? new Date(iso) : new Date();
  const p = n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function editEventTime(weekN, name, kind, key){
  const it = week(weekN).intros[name]; if(!it) return;
  const target = kind==="check" ? it.checks[key] : it.reactions[key];
  if(!target) return;
  const html = `
    <h3>✏️ Edit when this happened</h3>
    <p class="muted">${esc(name)} — ${kind==="check"?"check":"reaction note"}. Set the real date & time the activity occurred. We'll keep a record that this entry was edited.</p>
    <label>Actual date &amp; time</label>
    <input type="datetime-local" id="editDt" value="${toLocalInput(target.at)}">
    ${target.editedAt?`<p class="editstamp">last edited by ${esc(target.editedBy||'?')} on ${fmtStamp(target.editedAt)}</p>`:''}
    <div class="row" style="margin-top:12px">
      <button class="btn small" id="editSave">Save time</button>
      <button class="btn sec small" id="editCancel">Cancel</button>
    </div>`;
  openModal(html, true);
  document.getElementById("editCancel").onclick = closeModal;
  document.getElementById("editSave").onclick = ()=>{
    const v = document.getElementById("editDt").value;
    if(!v){ toast("Pick a date & time."); return; }
    const newIso = new Date(v).toISOString();
    if(!target.origAt) target.origAt = target.at;   // remember the first recorded time once
    target.at = newIso;
    target.editedAt = stampNow();
    target.editedBy = S.activeParent;
    save(); closeModal(); render();
    toast("Updated the activity time (edit recorded).");
  };
}

/* ---------------- rendering ---------------- */
const main = document.getElementById("main");
let currentTab = "plan";
let foodFilterNutrient = "";   // nutrition filter on Foods tab
let foodSearch = "";           // search box text
let foodSort = "default";      // "default" | "az"
let foodAgeBand = "";          // "" | 6m | 6-9m | 9-12m | 12m+
let foodShowAllergens = true;  // include allergens in the Foods list

function render(){
  const bf = document.getElementById("babyNameFoot"); if(bf) bf.textContent = S.baby.name || "Baby";
  const disc = document.getElementById("disclaimer"); if(disc) disc.classList.toggle("hide", S.settings.disclaimerDismissed);
  if(S.cloud.url){ const el=document.getElementById("syncState"); if(el && el.textContent==="Local only") setSyncLabel("Connected", true); }
  if(!S.cloud.url) setSyncLabel("Local only", false);

  try{
    if(main) main.onclick = null;   // clear any delegated handler from a prior tab
    if(currentTab==="plan") renderPlan();
    else if(currentTab==="foods") renderFoods();
    else if(currentTab==="pantry") renderPantry();
    else if(currentTab==="allergens") renderAllergens();
    else if(currentTab==="log") renderLog();
    else if(currentTab==="settings") renderSettings();
  }catch(err){
    if(main) main.innerHTML = `<div class="card"><h3>⚠️ Something hiccuped on this screen</h3>
      <p class="muted">The app caught an error so it didn't go blank. This helps us fix it:</p>
      <pre style="background:#fdecec;color:#7a2f28;padding:10px;border-radius:8px;overflow-x:auto;font-size:12px;white-space:pre-wrap">${esc(String(err&&err.stack||err))}</pre>
      <p class="muted">Your saved data is safe. Try another tab, or screenshot this and send it over.</p></div>`;
    console.error("render error:", err);
  }
}

/* ---------- PLAN (weekly calendar) ---------- */
function renderPlan(){
  const w = week(S.activeWeek);
  let html = "";

  html += `<div class="card">
    <div class="dayhead">
      <div><h2 style="margin:0">Weekly Plan</h2><span class="muted">Build each week from foods you choose</span></div>
      <select id="parentSel" style="width:auto">
        ${S.baby.parents.map(p=>`<option ${p===S.activeParent?"selected":""}>${esc(p)}</option>`).join("")}
      </select>
    </div>
    <div class="muted" style="margin-bottom:8px">Checks record who &amp; when. Logging as the person above.</div>
    <div class="daysel" id="weekSel">
      ${S.weeks.map(wk=>{
        const foods=(wk.foods||[]).length;
        const done=Object.values(wk.intros||{}).filter(i=>i.introduced).length;
        return `<div class="daychip ${wk.n===S.activeWeek?'active':''} ${foods&&done===foods?'done':''}" data-week="${wk.n}">
          Week ${wk.n}<small>${weekRangeLabel(wk.n)}</small></div>`;
      }).join("")}
      <div class="daychip" id="addWeek" style="min-width:48px">＋<small>week</small></div>
    </div>
  </div>`;

  // week builder: add foods
  html += `<div class="card">
    <div class="dayhead"><h3 style="margin:0">Week ${w.n} · ${weekRangeLabel(w.n)}</h3></div>
    <button class="btn sec small" id="addFoodBtn">➕ Add a food to this week</button>`;
  if(!(w.foods||[]).length){
    const okCount = buildSuggestions().length;
    html += `<p class="muted" style="margin-top:10px">No foods yet for this week.${okCount?' See <b>Foods to try next</b> below — suggestions based on what '+esc(S.baby.name)+' already tolerates.':' Add from the <b>Foods</b> or <b>Allergens</b> tab, or tap the button above.'}</p>`;
  }
  html += `</div>`;

  // try-next suggestions based on what's been tried (cross-reactivity-informed)
  const sugg = buildSuggestions();
  const toleratedNames = startedFoods();
  if(sugg.length){
    const ok = sugg.filter(s=>s.tier==="ok").slice(0,6);
    const care = sugg.filter(s=>s.tier==="care").slice(0,6);
    html += `<div class="card" style="border-color:var(--green)"><h3>💡 Foods to try next in Week ${w.n}</h3>
      <p class="muted">Because ${esc(S.baby.name)} has tolerated <b>${toleratedNames.length?toleratedNames.map(esc).join(", "):'some foods'}</b>, here's what allergy cross-reactivity research suggests is lower- or higher-risk to try next. Still introduce one new food at a time and confirm with your pediatrician.</p>`;
    const renderSugg = (s)=>`<div class="check-row"><div class="check-main">
        <div class="check-title">${s.emoji||"🍽️"} ${esc(s.name)}
          ${s.tier==="care"?'<span class="pill allergen">🟡 introduce carefully</span>':'<span class="pill safe">🟢 likely well tolerated</span>'}</div>
        <div class="check-meta">${esc(s.why)}</div>
      </div><button class="btn sec small" style="flex:0 0 auto" data-sugg="${esc(s.name)}" data-se="${esc(s.emoji||'🍽️')}">Add to Week ${w.n}</button></div>`;
    if(ok.length){ html += `<div class="check-meta" style="margin:6px 0;font-weight:600;color:var(--green-d)">🟢 Lower-risk — reassuring to try</div>` + ok.map(renderSugg).join(""); }
    if(care.length){ html += `<div class="check-meta" style="margin:10px 0 6px;font-weight:600;color:var(--red)">🟡 Higher cross-reactivity — introduce one at a time</div>` + care.map(renderSugg).join(""); }
    html += `<div class="note" style="margin-top:8px">🟢 = a <b>low cross-reactivity</b> family (tolerating one is reassuring for the others — e.g. tolerating peanut makes other legumes like soy, lentils, chickpeas low-risk). 🟡 = <b>high cross-reactivity</b> family — tolerating one does <b>not</b> mean the others are safe, so offer each on its own and watch. Rates from Francis et al., J Food Allergy 2020 (FARE).</div>`;
    html += `</div>`;
  }

  // per-food checklist blocks for the week (Day 1/2/3 inside the week)
  (w.foods||[]).forEach(name=>{
    const it = w.intros[name]; if(!it) return;
    const item = itemByName(name);
    html += `<div class="card">
      <div class="dayhead">
        <div><h3 style="margin:0"><span class="tap-name" data-prep="${esc(name)}">${it.emoji} ${esc(name)}</span> ${it.isAllergen?'<span class="pill allergen">allergen</span>':''}
          ${it.introduced?'<span class="pill safe">Introduced ✓</span>':''}</h3>
          <span class="muted" data-prep2="${esc(name)}" style="cursor:pointer">👆 tap the name for prep info${item?` · ${(item.nutrients||[]).map(n=>`${NUTRIENTS[n]||''} ${n}`).join(" · ")}`:''}</span>
        </div>
        <button class="btn danger small" style="width:auto" data-rm="${esc(name)}">Remove</button>
      </div>
      <button class="btn ${it.introduced?'sec':''} small" style="margin-bottom:6px" data-intro="${esc(name)}">${it.introduced?'✓ Introduced (tap to undo)':'Mark introduced ✓'}</button>`;
    // 3 day watch
    it.days.forEach(d=>{
      const total=d.items.length, done=d.items.filter(x=>it.checks[`${d.day}:${x.id}`]).length;
      html += `<details ${d.day===1?'open':''}><summary>Day ${d.day} · ${dayLabel(w.n,d.day)} <span class="muted">(${done}/${total})</span></summary>`;
      d.items.forEach(itm=>{
        const c = it.checks[`${d.day}:${itm.id}`];
        html += `<div class="check-row">
          <div class="check-box ${c?'on':''}" data-week="${w.n}" data-food="${esc(name)}" data-day="${d.day}" data-item="${itm.id}">${c?'✓':''}</div>
          <div class="check-main"><div class="check-title">${esc(itm.text)}</div>
          ${c?`<span class="stamp">✓ ${esc(c.by)} · ${fmtStamp(c.at)}</span>
             <button class="pencil" data-edit="check" data-ew="${w.n}" data-ef="${esc(name)}" data-ek="${d.day}:${itm.id}">✏️ edit time</button>
             ${c.editedAt?`<div class="editstamp">edited by ${esc(c.editedBy||'?')} · ${fmtStamp(c.editedAt)}</div>`:''}`
            :`<div class="check-meta">not checked yet</div>`}</div></div>`;
      });
      const r = it.reactions[d.day];
      html += `<div class="react-note" style="padding-left:4px">
        ${r?`<span class="stamp react">⚠ ${esc(r.by)} · ${fmtStamp(r.at)}</span>
          <button class="pencil" data-edit="react" data-ew="${w.n}" data-ef="${esc(name)}" data-ek="${d.day}">✏️ edit time</button>
          ${r.editedAt?`<div class="editstamp">edited by ${esc(r.editedBy||'?')} · ${fmtStamp(r.editedAt)}</div>`:''}
          <div class="note">${esc(r.text)||'(no text)'}</div>`:''}
        <button class="btn danger small" style="margin-top:6px;width:auto" data-react="${esc(name)}" data-rday="${d.day}">⚠️ Log reaction / note</button>
      </div></details>`;
    });
    html += `</div>`;
  });

  html += `<div class="card"><details><summary>What a reaction can look like</summary>
    <ul class="steps">${REACTION_SIGNS.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
    <div class="note" style="border-color:#f3cfcf;background:#fdecec;color:#7a2f28">${esc(EMERGENCY_TEXT)}</div>
  </details></div>`;

  main.innerHTML = html; wirePlan();
}

function wirePlan(){
  const ps=document.getElementById("parentSel"); if(ps) ps.onchange=()=>{ S.activeParent=ps.value; saveLocal(); };
  // Event delegation: ONE listener handles every tappable element, so a handler
  // can never silently fail to bind even if a later part of render hiccups.
  main.onclick = (e)=>{
    const t = e.target.closest("[data-week],#addWeek,#addFoodBtn,[data-sugg],[data-rm],[data-intro],.check-box,[data-react],[data-prep],[data-prep2],[data-edit]");
    if(!t) return;
    if(t.id==="addWeek"){ ensureWeek(S.weeks.length+1); S.activeWeek=S.weeks.length; save(); render(); return; }
    if(t.id==="addFoodBtn"){ currentTab="foods"; setActiveTab(); render(); toast(`Pick foods — they add to Week ${S.activeWeek}`); return; }
    if(t.matches("#weekSel [data-week]")){ S.activeWeek=+t.dataset.week; render(); return; }
    if(t.hasAttribute("data-sugg")){ const it=itemByName(t.dataset.sugg); addFoodToWeek(S.activeWeek,t.dataset.sugg,t.dataset.se,it?it.isAllergen:false); render(); return; }
    if(t.hasAttribute("data-rm")){ if(confirm(`Remove ${t.dataset.rm} from Week ${S.activeWeek}?`)) removeFoodFromWeek(S.activeWeek,t.dataset.rm); return; }
    if(t.hasAttribute("data-intro")){ markIntroduced(S.activeWeek,t.dataset.intro); return; }
    if(t.classList.contains("check-box")){ toggleCheck(+t.dataset.week,t.dataset.food,+t.dataset.day,t.dataset.item); return; }
    if(t.hasAttribute("data-react")){ logReaction(S.activeWeek,t.dataset.react,+t.dataset.rday); return; }
    if(t.hasAttribute("data-prep")){ showPrep(t.dataset.prep); return; }
    if(t.hasAttribute("data-prep2")){ showPrep(t.dataset.prep2); return; }
    if(t.hasAttribute("data-edit")){ editEventTime(+t.dataset.ew, t.dataset.ef, t.dataset.edit, t.dataset.ek); return; }
  };
}

/* build try-next suggestions from tolerated groups, excluding already-planned */
function buildSuggestions(){
  const planned = new Set(allPlannedFoods().map(s=>s.toLowerCase()));
  const out = [];
  triedGroups().forEach(g=>{
    (GROUP_SUGGESTIONS[g]||[]).forEach(s=>{
      if(!planned.has(s.name.toLowerCase())){
        const known = itemByName(s.name);
        out.push({ name:s.name, why:s.why, group:g, tier:s.tier||"ok", emoji: known?known.emoji:groupEmoji(g) });
      }
    });
  });
  return out;
}
function groupEmoji(g){
  const f = FOODS.find(x=>x.group===g) || ALLERGENS.find(x=>x.group===g);
  return f ? (f.groupEmoji||f.emoji) : "🍽️";
}

/* ---------- FOODS (nutrition + age + search + sort filters) ---------- */
function renderFoods(){
  const nutOpts = Object.keys(NUTRIENTS).map(n=>`<option value="${n}" ${foodFilterNutrient===n?'selected':''}>${NUTRIENTS[n]} ${n}</option>`).join("");
  const ageOpts = Object.keys(AGE_BANDS).map(a=>`<option value="${a}" ${foodAgeBand===a?'selected':''}>${esc(AGE_BANDS[a])}</option>`).join("");
  let html = `<div class="card"><h2>Foods</h2>
    <p class="muted">Tap a food's name for full prep info, or <b>Add</b> to put it into <b>Week ${S.activeWeek}</b> of your plan. Age guidance is general — your pediatrician's advice wins.</p>
    <label>Search</label>
    <input id="foodSearch" placeholder="Search foods (e.g. banana, iron, nut)" value="${esc(foodSearch)}">
    <div class="row" style="margin-top:10px">
      <div><label style="margin-top:0">Age group</label>
        <select id="ageFilter"><option value="">All ages</option>${ageOpts}</select></div>
      <div><label style="margin-top:0">Key nutrient</label>
        <select id="nutFilter"><option value="">All nutrients</option>${nutOpts}</select></div>
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn ${foodSort==='az'?'':'sec'} small" id="sortToggle">${foodSort==='az'?'✓ A → Z':'Sort A → Z'}</button>
      <button class="btn ${foodShowAllergens?'':'sec'} small" id="allToggle">${foodShowAllergens?'✓ Showing allergens':'Allergens hidden'}</button>
    </div>
  </div>`;

  // build the working list: foods (+ allergens if toggled)
  let list = FOODS.map(f=>({ ...f, isAllergen:false }));
  if(foodShowAllergens) list = list.concat(ALLERGENS.map(a=>({ ...a, isAllergen:true })));

  // filters
  const q = foodSearch.trim().toLowerCase();
  list = list.filter(f=>{
    if(foodAgeBand && f.ageBand !== foodAgeBand) return false;
    if(foodFilterNutrient && !(f.nutrients||[]).includes(foodFilterNutrient)) return false;
    if(q){
      const hay = [f.name, f.group, (f.nutrients||[]).join(" "), f.ageText, f.tips, f.note].join(" ").toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  // sort
  if(foodSort==="az") list.sort((a,b)=>a.name.localeCompare(b.name));

  html += `<div class="card"><p class="muted" style="margin:0 0 8px">${list.length} food${list.length!==1?'s':''}</p>`;
  if(!list.length) html += `<p class="muted">Nothing matches those filters. Clear the search or widen the age group.</p>`;
  list.forEach(f=>{
    const planned = allPlannedFoods().includes(f.name);
    const rows = f.isAllergen
      ? `<b>How</b><span>${esc(f.how)}</span><b>Amount</b><span>${esc(f.amount)}</span><b>Watch</b><span>${esc(f.watch)}</span><b>Note</b><span>${esc(f.note)}</span>`
      : `<b>Cook</b><span>${esc(f.cook)}</span><b>Temp</b><span>${esc(f.temp)}</span><b>Texture</b><span>${esc(f.texture)}</span><b>Amount</b><span>${esc(f.amount)}</span><b>Tips</b><span>${esc(f.tips)}</span>`;
    html += `<div class="food-item">
      <div class="food-name"><span class="tap-name" data-prep="${esc(f.name)}">${f.emoji} ${esc(f.name)}</span>
        ${f.isAllergen?'<span class="pill allergen">allergen</span>':`<span class="pill safe">${esc(f.group)}</span>`}
        ${f.choke?'<span class="pill allergen">⚠ choking care</span>':''}</div>
      <div class="pill" style="background:#eef4e8;border-color:#d6e4c9;color:var(--green-d)">👶 ${esc(AGE_BANDS[f.ageBand]||'~6 months')}</div>
      <div style="margin:4px 0">${(f.nutrients||[]).map(n=>`<span class="pill ${n===foodFilterNutrient?'allergen':''}">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("")}</div>
      <div class="food-grid"><b>Age</b><span>${esc(f.ageText||'')}</span>${rows}</div>
      <button class="btn ${planned?'sec':''} small" style="margin-top:8px" data-food="${esc(f.name)}" data-emoji="${f.emoji}" data-fa="${f.isAllergen?1:0}">${planned?'✓ In plan — add again':'➕ Add to Week '+S.activeWeek}</button>
    </div>`;
  });
  html += `</div>`;
  html += `<div class="note">🥄 <b>Choking safety:</b> no honey before 12 months, no whole nuts/grapes/round coins/hard chunks, no cow's milk as a drink before 12 months, no added salt or sugar. Smash berries & quarter tomatoes. Always supervise; keep baby upright.</div>`;
  main.innerHTML = html;

  const si = document.getElementById("foodSearch");
  si.oninput = (e)=>{ foodSearch=e.target.value; const pos=e.target.selectionStart; render(); const n=document.getElementById("foodSearch"); if(n){ n.focus(); n.setSelectionRange(pos,pos); } };
  document.getElementById("ageFilter").onchange = (e)=>{ foodAgeBand=e.target.value; render(); };
  document.getElementById("nutFilter").onchange = (e)=>{ foodFilterNutrient=e.target.value; render(); };
  document.getElementById("sortToggle").onclick = ()=>{ foodSort = foodSort==="az"?"default":"az"; render(); };
  document.getElementById("allToggle").onclick = ()=>{ foodShowAllergens = !foodShowAllergens; render(); };
  document.querySelectorAll("[data-prep]").forEach(b=>b.onclick=()=>showPrep(b.dataset.prep));
  document.querySelectorAll("[data-food]").forEach(b=>b.onclick=()=>{ addFoodToWeek(S.activeWeek,b.dataset.food,b.dataset.emoji,b.dataset.fa==="1"); render(); });
}

/* ---------- PANTRY ---------- */
function renderPantry(){
  let html = `<div class="card"><h2>🧊 Fridge / Pantry</h2>
    <p class="muted">Type ingredients you have at home. We'll suggest baby-safe foods to try — matching your ingredients and pointing you toward foods in the same groups ${esc(S.baby.name)} already does well with.</p>
    <label>Add an ingredient</label>
    <div class="row"><input id="pantryIn" placeholder="e.g. sweet potato, yogurt, banana"><button class="btn small" style="flex:0 0 auto" id="pantryAdd">Add</button></div>`;
  if(S.pantry.length){
    html += `<div style="margin-top:10px">${S.pantry.map((p,i)=>`<span class="pill">${esc(p)} <span data-prm="${i}" style="cursor:pointer;color:var(--red)">✕</span></span>`).join("")}</div>`;
  }
  html += `</div>`;

  const matches = pantrySuggestions();
  html += `<div class="card"><h3>Suggestions from your pantry</h3>`;
  if(!S.pantry.length){ html += `<p class="muted">Add a few ingredients above to see suggestions.</p>`; }
  else if(!matches.length){ html += `<p class="muted">No direct baby-food matches yet — try ingredients like sweet potato, banana, avocado, oats, carrot, yogurt, egg.</p>`; }
  else {
    matches.forEach(m=>{
      const planned = allPlannedFoods().includes(m.name);
      html += `<div class="check-row"><div class="check-main">
        <div class="check-title">${m.emoji} ${esc(m.name)} <span class="pill ${m.isAllergen?'allergen':'safe'}">${esc(m.group)}</span> ${m.reasonTag}</div>
        <div class="check-meta">${esc(m.why)}</div>
        <div style="margin-top:4px">${(m.nutrients||[]).map(n=>`<span class="pill">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("")}</div>
      </div><button class="btn ${planned?'sec':''} small" style="flex:0 0 auto" data-padd="${esc(m.name)}" data-pe="${m.emoji}">${planned?'✓':'Add'}</button></div>`;
    });
  }
  html += `</div>`;
  main.innerHTML = html; wirePantry();
}
function wirePantry(){
  const add=()=>{ const v=document.getElementById("pantryIn").value.trim(); if(v){ S.pantry.push(v); save(); render(); } };
  const b=document.getElementById("pantryAdd"); if(b) b.onclick=add;
  const inp=document.getElementById("pantryIn"); if(inp) inp.onkeydown=(e)=>{ if(e.key==="Enter") add(); };
  document.querySelectorAll("[data-prm]").forEach(x=>x.onclick=()=>{ S.pantry.splice(+x.dataset.prm,1); save(); render(); });
  document.querySelectorAll("[data-padd]").forEach(x=>x.onclick=()=>{ const it=itemByName(x.dataset.padd); addFoodToWeek(S.activeWeek,x.dataset.padd,x.dataset.pe,it?it.isAllergen:false); render(); });
}
/* match pantry text to known foods, + same-group next-steps */
function pantrySuggestions(){
  const pantryLc = S.pantry.map(p=>p.toLowerCase());
  const out = []; const seen = new Set();
  const triedG = new Set(triedGroups());
  // 1) direct matches: an ingredient name appears in / contains a known food name
  allItems().forEach(it=>{
    const nameLc = it.name.toLowerCase().replace(/\s*\(.*?\)/,"").trim();
    const hit = pantryLc.some(p=> p.includes(nameLc) || nameLc.includes(p) || sharesWord(p,nameLc));
    if(hit && !seen.has(it.name)){
      seen.add(it.name);
      out.push({ name:it.name, emoji:it.emoji, group:it.group, isAllergen:it.isAllergen,
        nutrients:it.nutrients, why: it.isAllergen?`You have this — it's an allergen, introduce carefully (${it.how.split(".")[0]}).`:`You have this on hand — ${it.amount}`,
        reasonTag: triedG.has(it.group)?'<span class="pill safe">same group tried</span>':'<span class="pill">in your pantry</span>', score: triedG.has(it.group)?2:3 });
    }
  });
  // 2) same-group next steps for tolerated groups (even if not literally in pantry)
  triedGroups().forEach(g=>{
    (GROUP_SUGGESTIONS[g]||[]).forEach(s=>{
      if(seen.has(s.name)) return;
      // only surface if a pantry word loosely relates OR it's a strong group pick
      const known = itemByName(s.name);
      out.push({ name:s.name, emoji: known?known.emoji:groupEmoji(g), group:g, isAllergen: known?known.isAllergen:false,
        nutrients: known?known.nutrients:[], why:s.why,
        reasonTag:'<span class="pill safe">goes with '+esc(g)+'</span>', score:1 });
      seen.add(s.name);
    });
  });
  return out.sort((a,b)=>b.score-a.score);
}
function sharesWord(a,b){
  const aw=a.split(/\W+/).filter(w=>w.length>3), bw=b.split(/\W+/).filter(w=>w.length>3);
  return aw.some(w=>bw.includes(w));
}

/* ---------- ALLERGENS ---------- */
function renderAllergens(){
  let html = `<div class="card"><h2>Allergen schedule</h2>
    <p class="muted">Introduce one allergen at a time, early, in the morning, on a day you can watch baby for a few hours. A common pace is <b>one new allergen per week</b>, kept in rotation afterward. Tap <b>Add</b> to drop one into a week of your plan.</p>
    <div class="note" style="border-color:#f3cfcf;background:#fdecec;color:#7a2f28"><b>Confirm this order &amp; timing with your pediatrician</b>, especially with family history of allergies or eczema.</div>
  </div><div class="card">`;
  ALLERGENS.forEach(a=>{
    const planned = allPlannedFoods().includes(a.name);
    html += `<div class="food-item">
      <div class="food-name">${a.emoji} ${esc(a.name)} <span class="pill allergen">Suggested week ${a.week}</span></div>
      <div style="margin:4px 0">${(a.nutrients||[]).map(n=>`<span class="pill">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("")}</div>
      <div class="food-grid">
        <b>How</b><span>${esc(a.how)}</span><b>Amount</b><span>${esc(a.amount)}</span>
        <b>Watch</b><span>${esc(a.watch)}</span><b>Note</b><span>${esc(a.note)}</span>
      </div>
      <button class="btn ${planned?'sec':''} small" style="margin-top:8px" data-all="${esc(a.name)}" data-emoji="${a.emoji}">${planned?'✓ In plan':'➕ Add to Week '+S.activeWeek}</button>
    </div>`;
  });
  html += `</div>`;
  main.innerHTML = html;
  document.querySelectorAll("[data-all]").forEach(b=>b.onclick=()=>{ addFoodToWeek(S.activeWeek,b.dataset.all,b.dataset.emoji,true); render(); });
}

/* ---------- LOG (summarized per food) ---------- */
function renderLog(){
  let html = `<div class="card"><h2>History log</h2><p class="muted">One summary per food, newest activity first — with every timestamp and who did it folded in.</p></div>`;
  // gather per-food activity across all weeks
  const byFood = {};
  S.weeks.forEach(w=>{
    Object.entries(w.intros||{}).forEach(([name,it])=>{
      const key = name;
      if(!byFood[key]) byFood[key] = { name, emoji:it.emoji, isAllergen:it.isAllergen, group:(itemByName(name)||{}).group, events:[], introduced:false, weeks:new Set() };
      byFood[key].weeks.add(w.n);
      if(it.introduced) byFood[key].introduced = true;
      Object.entries(it.checks||{}).forEach(([k,c])=>{
        const [day,itemId]=k.split(":"); const dObj=it.days.find(d=>d.day==day); const itm=dObj&&dObj.items.find(x=>x.id===itemId);
        byFood[key].events.push({ at:c.at, by:c.by, text:(itm?itm.text:itemId), react:false, week:w.n, day,
          food:name, kind:"check", ekey:k, editedAt:c.editedAt, editedBy:c.editedBy });
      });
      Object.entries(it.reactions||{}).forEach(([day,r])=>{
        byFood[key].events.push({ at:r.at, by:r.by, text:"⚠ Reaction: "+(r.text||""), react:true, week:w.n, day,
          food:name, kind:"react", ekey:day, editedAt:r.editedAt, editedBy:r.editedBy });
      });
    });
  });
  const foods = Object.values(byFood).map(f=>{
    f.events.sort((a,b)=>(b.at||"").localeCompare(a.at||""));
    f.last = f.events[0] ? f.events[0].at : "";
    return f;
  }).filter(f=>f.events.length).sort((a,b)=>(b.last||"").localeCompare(a.last||""));

  if(!foods.length){ html += `<div class="card"><p class="muted">Nothing logged yet. Check items off in the Weekly Plan.</p></div>`; main.innerHTML=html; return; }

  foods.forEach(f=>{
    const checks = f.events.filter(e=>!e.react).length;
    const reacts = f.events.filter(e=>e.react).length;
    const people = [...new Set(f.events.map(e=>e.by))];
    html += `<div class="card"><details ${foods.length<=2?'open':''}>
      <summary>${f.emoji} ${esc(f.name)} ${f.introduced?'<span class="pill safe">Introduced ✓</span>':''} ${reacts?'<span class="pill allergen">'+reacts+' reaction note'+(reacts>1?'s':'')+'</span>':''}
        <span class="muted">— ${checks} check${checks!==1?'s':''}, last ${fmtStamp(f.last)}</span></summary>
      <div class="check-meta" style="margin:6px 0">Week${f.weeks.size>1?'s':''} ${[...f.weeks].sort((a,b)=>a-b).join(", ")} · logged by ${people.map(esc).join(", ")}</div>`;
    f.events.forEach(e=>{
      html += `<div class="check-row"><div class="check-main">
        <div class="check-title" style="font-weight:500">${esc(e.text)}</div>
        <span class="stamp ${e.react?'react':''}">${esc(e.by)} · W${e.week} D${e.day} · ${fmtStamp(e.at)}</span>
        <button class="pencil" data-edit="${e.kind}" data-ew="${e.week}" data-ef="${esc(e.food)}" data-ek="${esc(e.ekey)}">✏️ edit time</button>
        ${e.editedAt?`<div class="editstamp">edited by ${esc(e.editedBy||'?')} · ${fmtStamp(e.editedAt)}</div>`:''}
      </div></div>`;
    });
    html += `</details></div>`;
  });
  main.innerHTML = html;
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEventTime(+b.dataset.ew, b.dataset.ef, b.dataset.edit, b.dataset.ek));
}

/* ---------- SETTINGS ---------- */
function renderSettings(){
  const url = S.cloud.url || "";
  let html = `<div class="card"><h2>Baby &amp; parents</h2>
    <label>Baby's name</label><input id="babyName" value="${esc(S.baby.name)}">
    <label>Parent / caregiver names (comma separated)</label><input id="parentsIn" value="${esc(S.baby.parents.join(", "))}">
    <label>Week 1 start date</label><input type="date" id="startDate" value="${new Date(S.startDateISO).toISOString().slice(0,10)}">
    <button class="btn small" style="margin-top:10px" id="saveProfile">Save</button>
  </div>`;

  html += `<div class="card"><h2>☁️ Google Sheets sync</h2>
    <p class="muted">Saves on this device automatically and syncs to your Google Sheet so both phones share one plan.</p>
    <button class="btn sec small" id="tutBtn" style="margin-bottom:10px">📖 How to set up cloud saving (tutorial)</button>
    <label>Your Apps Script Web App link</label>
    <input id="cloudUrl" placeholder="https://script.google.com/macros/s/..../exec" value="${esc(url)}">
    <div class="row" style="margin-top:10px"><button class="btn small" id="saveCloud">Connect</button><button class="btn sec small" id="pullCloud">⬇️ Load</button></div>
    <div class="row" style="margin-top:8px"><button class="btn sec small" id="pushCloud">⬆️ Save to Sheet now</button></div>
    <p class="muted" style="margin-top:8px">Last sync: ${S.cloud.lastSync?fmtStamp(S.cloud.lastSync):"never"}</p>
  </div>`;

  html += `<div class="card"><h2>Data</h2>
    <button class="btn sec small" id="exportBtn">⬇️ Export backup file</button>
    <button class="btn danger small" style="margin-top:8px" id="resetBtn">Reset everything</button>
  </div>`;

  main.innerHTML = html;
  document.getElementById("saveProfile").onclick=()=>{
    S.baby.name=document.getElementById("babyName").value.trim()||"Baby";
    S.baby.parents=document.getElementById("parentsIn").value.split(",").map(s=>s.trim()).filter(Boolean);
    if(!S.baby.parents.length) S.baby.parents=["Parent 1"];
    if(!S.baby.parents.includes(S.activeParent)) S.activeParent=S.baby.parents[0];
    const dv=document.getElementById("startDate").value; if(dv){ const d=new Date(dv); d.setHours(0,0,0,0); S.startDateISO=d.toISOString(); }
    save(); toast("Saved"); render();
  };
  document.getElementById("saveCloud").onclick=async()=>{ S.cloud.url=document.getElementById("cloudUrl").value.trim(); saveLocal();
    if(S.cloud.url){ setSyncLabel("Connecting…"); await cloudPush(); toast("Connected."); } else setSyncLabel("Local only",false); render(); };
  document.getElementById("pullCloud").onclick=cloudPull;
  document.getElementById("pushCloud").onclick=async()=>{ await cloudPush(); toast("Saved to Sheet."); };
  { const tb=document.getElementById("tutBtn"); if(tb) tb.onclick=showSetupTutorial; }
  document.getElementById("exportBtn").onclick=()=>{ const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="baby-solids-backup.json"; a.click(); };
  document.getElementById("resetBtn").onclick=()=>{ if(confirm("Erase all tracked data on this device? (Your Google Sheet copy stays unless you overwrite it.)")){
    S=JSON.parse(JSON.stringify(DEFAULT_STATE)); migrate(); saveLocal(); render(); toast("Reset."); } };
}

/* ---------------- tabs & boot ---------------- */
function setActiveTab(){ document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===currentTab)); }
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{ currentTab=t.dataset.tab; setActiveTab(); render(); });
{ const d=document.getElementById("dismissDisc"); if(d) d.onclick=()=>{ S.settings.disclaimerDismissed=true; saveLocal(); render(); }; }
{ const s=document.getElementById("syncBtn"); if(s) s.onclick=()=>{ currentTab="settings"; setActiveTab(); render(); }; }

try{ normalizeState(); }catch(e){ console.error("normalize error:", e); }
render();
if(S.cloud.url){ cloudPull(); }
