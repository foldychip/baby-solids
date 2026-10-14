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
function weekAnchor(iso){
  const d = new Date(iso); const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate()-dow); d.setHours(0,0,0,0); return d;
}
function weekStart(n){ const m = weekAnchor(S.startDateISO); m.setDate(m.getDate()+(n-1)*7); return m; }
function weekRangeLabel(n){
  const s = weekStart(n); const e = new Date(s); e.setDate(e.getDate()+6);
  const f = d=>d.toLocaleDateString([], {month:"short",day:"numeric"});
  return `${f(s)} – ${f(e)}`;
}
function dayDate(weekN, dayN){ const s = weekStart(weekN); const d=new Date(s); d.setDate(d.getDate()+(dayN-1)); return d; }
function dayLabel(weekN, dayN){ return dayDate(weekN,dayN).toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}); }
/* weekday index (0=Mon .. 6=Sun) -> real Date within week N (weeks are Monday-anchored) */
function dowDate(weekN, idx){ const s = weekStart(weekN); const d=new Date(s); d.setDate(d.getDate()+idx); return d; }
/* ISO timestamp -> local YYYY-MM-DD (for <input type=date>), avoiding UTC day-shift */
function isoToLocalDate(iso){ const d=iso?new Date(iso):new Date(); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }

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
      if(!it.dow || typeof it.dow!=="object") it.dow = {};
      if(!Array.isArray(it.reactList)) it.reactList = [];
      // Retire the old Day 1/2/3 model: drop legacy checks/reactions entirely
      // (the app now records feeding by day-of-week in it.dow and notes in it.reactList).
      it.checks = {};
      it.reactions = {};
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

/* ---------------- backups (local snapshots) ---------------- */
const BK_KEY = "littleBites.backups.v1";
const BK_MAX = 15;
function loadBackups(){ try{ return JSON.parse(localStorage.getItem(BK_KEY)||"[]"); }catch(e){ return []; } }
function saveBackups(list){ try{ localStorage.setItem(BK_KEY, JSON.stringify(list.slice(0,BK_MAX))); }catch(e){} }
/* Snapshot the CURRENT in-memory state. reason is a short label. Skips trivial/empty states unless forced. */
function makeBackup(reason, force){
  try{
    const snap = JSON.parse(JSON.stringify(S));
    const foods = (S.weeks||[]).reduce((a,w)=>a+Object.keys(w.intros||{}).length,0);
    if(!force && foods===0) return; // nothing worth keeping
    const list = loadBackups();
    // avoid duplicate back-to-back snapshots of identical data
    const body = JSON.stringify(snap);
    if(list[0] && JSON.stringify(list[0].data)===body) return;
    list.unshift({ at: new Date().toISOString(), reason: reason||"auto", foods, data: snap });
    saveBackups(list);
  }catch(e){ console.error("backup error:", e); }
}
function restoreBackup(idx){
  const list = loadBackups();
  const b = list[idx]; if(!b) return;
  makeBackup("before restore", true);              // snapshot current first, so revert is itself undoable
  const url = S.cloud.url;                          // keep this device's sheet link
  S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), b.data);
  S.cloud.url = url;
  migrate(); normalizeState(); saveLocal();
  render(); toast("Reverted to the "+fmtStamp(b.at)+" backup.");
}

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
      makeBackup("before loading from Sheet");   // guard: snapshot what's on this device first
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
/* display-only: capitalize each word; keep stored names unchanged */
function titleCase(s){ return String(s==null?"":s).replace(/\b([a-z])/g, m=>m.toUpperCase()); }

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
  const it = itemByName(name);
  if(!it){
    openModal(`<h3>🍽️ ${esc(name)}</h3><p class="muted">This is a custom food you added, so there's no stored prep guide. General tips: cook until very soft, cool to lukewarm, purée or mash smooth, start with 1–2 teaspoons, and watch for any reaction.</p>`, true);
    return;
  }
  const nutr = (it.nutrients||[]).map(n=>`<span class="pill">${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("");
  // Primary line shown up front; the rest folds into "More Details"
  const primary = it.isAllergen
    ? `<b>How</b><span>${esc(it.how)}</span>`
    : `<b>Cook</b><span>${esc(it.cook)}</span><b>Texture</b><span>${esc(it.texture)}</span>`;
  const more = it.isAllergen
    ? `<b>Age</b><span>${esc(it.ageText||'')}</span><b>Amount</b><span>${esc(it.amount)}</span><b>Watch</b><span>${esc(it.watch)}</span><b>Note</b><span>${esc(it.note)}</span>`
    : `<b>Age</b><span>${esc(it.ageText||'')}</span><b>Temp</b><span>${esc(it.temp)}</span><b>Amount</b><span>${esc(it.amount)}</span><b>Tips</b><span>${esc(it.tips)}</span>`;
  openModal(`
    <div class="hero-img" style="height:120px;border-radius:14px;font-size:62px;margin:4px 0 12px">${it.emoji}</div>
    <h3>${esc(titleCase(it.name))} ${it.isAllergen?'<span class="pill allergen">⚠ allergen</span>':`<span class="pill safe">${esc(it.group)}</span>`} ${it.choke?'<span class="pill allergen">⚠ choking care</span>':''}</h3>
    <div class="muted" style="margin:2px 0 8px">👶 ${esc(AGE_BANDS[it.ageBand]||'~6 months')}</div>
    <div style="margin:6px 0 10px">${nutr}</div>
    <div class="food-grid">${primary}</div>
    <details style="margin-top:12px"><summary>More Details</summary>
      <div class="food-grid" style="margin-top:8px">${more}</div>
    </details>
    <div class="note" style="margin-top:12px">Educational guidance — confirm amounts &amp; allergen timing with your pediatrician.</div>
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

/* popup: General Guide — first-year feeding reference by age */
function showGeneralGuide(){
  const g = FEEDING_GUIDE;
  let body = `<h3>📖 General Guide</h3>
    <p class="muted">A first-year feeding reference by age. Tap through the ages. General guidance only — follow your pediatrician and your baby's cues.</p>`;
  // one section per age band, each a label/value list
  g.ages.forEach((age,ci)=>{
    body += `<details ${ci===0?'open':''} style="margin-top:8px"><summary>${esc(age)}</summary><div class="guide-list">`;
    g.rows.forEach(r=>{
      const v = r.vals[ci];
      if(!v || v==="—") return;
      body += `<div class="guide-row"><div class="guide-k">${r.emoji} ${esc(r.label)}</div><div class="guide-v">${esc(v)}</div></div>`;
    });
    body += `</div></details>`;
  });
  body += `<div class="note" style="margin-top:12px">${esc(g.note)}</div>`;
  openModal(body, true);
}

/* all food names ever added to any week */
function allPlannedFoods(){
  const set = new Set();
  S.weeks.forEach(w=> (w.foods||[]).forEach(f=>set.add(f)) );
  return [...set];
}
/* total number of day-of-week feeding ticks for a food across ALL weeks (days eaten/recorded) */
function timesEaten(name){
  let n = 0;
  S.weeks.forEach(w=>{ const it=(w.intros||{})[name]; if(it&&it.dow){ n += Object.values(it.dow).filter(d=>d&&d.on).length; } });
  return n;
}
/* is this food in a SPECIFIC week's plan */
function foodInWeek(weekN, name){ const w=S.weeks[weekN-1]; return !!(w && (w.foods||[]).includes(name)); }
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
    const dowTicks = it.dow ? Object.values(it.dow).filter(d=>d&&d.on).length : 0;
    if(it.introduced || Object.keys(it.checks||{}).length || dowTicks) out.push(name);
  }) );
  return [...new Set(out)];
}
/* Tick/untick a feeding day-of-week. Stores the real feeding date so the Tracker plots that day. */
function toggleDow(weekN, name, idx){
  const it = week(weekN).intros[name]; if(!it) return;
  it.dow = it.dow || {};
  const rec = it.dow[idx];
  if(rec && rec.on){ delete it.dow[idx]; }
  else {
    const fed = dowDate(weekN, idx);
    const now = new Date();
    fed.setHours(now.getHours(), now.getMinutes(), 0, 0); // feeding DATE = that weekday, time = now
    it.dow[idx] = { on:true, fedISO: fed.toISOString(), at: stampNow(), by: S.activeParent };
  }
  save(); render();
}
/* Add a freeform reaction note (feeding-day = today unless edited later). */
function addReaction(weekN, name){
  const it = week(weekN).intros[name]; if(!it) return;
  const txt = prompt("Reaction / note — describe what you noticed (symptoms, timing). A record for you and your doctor:");
  if(txt===null) return;
  it.reactList = it.reactList || [];
  it.reactList.unshift({ at: stampNow(), fedISO: stampNow(), by: S.activeParent, text: txt.trim() });
  save(); render(); toast("Reaction note saved.");
}
/* Edit the TEXT of an existing reaction note; keeps an edited stamp. */
function editReactionText(weekN, name, ri){
  const it = week(weekN).intros[name]; if(!it || !it.reactList || !it.reactList[ri]) return;
  const r = it.reactList[ri];
  const txt = prompt("Edit this reaction / note:", r.text||"");
  if(txt===null) return;
  r.text = txt.trim();
  r.editedAt = stampNow();
  r.editedBy = S.activeParent;
  save(); render(); toast("Note updated.");
}
/* Delete a reaction note. */
function deleteReaction(weekN, name, ri){
  const it = week(weekN).intros[name]; if(!it || !it.reactList) return;
  if(!confirm("Delete this reaction / note?")) return;
  it.reactList.splice(ri,1);
  save(); render(); toast("Note deleted.");
}
/* Given a list of food names, return {have:[...], missing:[...]} nutrient coverage
   against the full NUTRIENTS list. Display-only, de-duplicated, ordered by NUTRIENTS. */
function nutrientCoverage(foodNames){
  const have = new Set();
  (foodNames||[]).forEach(nm=>{ const it=itemByName(nm); if(it&&it.nutrients) it.nutrients.forEach(n=>have.add(n)); });
  const all = Object.keys(NUTRIENTS);
  return { have: all.filter(n=>have.has(n)), missing: all.filter(n=>!have.has(n)) };
}
function nutrPills(list, dim){
  if(!list.length) return `<span class="muted">—</span>`;
  return list.map(n=>`<span class="pill" ${dim?'style="opacity:.55"':''}>${NUTRIENTS[n]||''} ${esc(n)}</span>`).join("");
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
  let target=null, timeField="at";
  if(kind==="check"){ target = it.checks[key]; }
  else if(kind==="react"){ target = it.reactions[key]; }
  else if(kind==="dow"){ target = it.dow && it.dow[key]; timeField="fedISO"; }    // edit the feeding date
  else if(kind==="reactlist"){ target = it.reactList && it.reactList[+key]; timeField="fedISO"; }
  if(!target) return;
  const label = kind==="check"?"check" : (kind==="dow"?"feeding day" : "reaction note");
  const curVal = target[timeField] || target.at;
  const html = `
    <h3>✏️ Edit when this happened</h3>
    <p class="muted">${esc(titleCase(name))} — ${label}. Set the real date &amp; time it occurred. We'll keep a record that this entry was edited.</p>
    <label>Actual date &amp; time</label>
    <input type="datetime-local" id="editDt" value="${toLocalInput(curVal)}">
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
    if(!target.origAt) target.origAt = curVal;   // remember the first recorded value once
    target[timeField] = newIso;                   // move the feeding date/time
    target.editedAt = stampNow();                 // record WHEN the edit happened (kept as detail)
    target.editedBy = S.activeParent;
    save(); closeModal(); render();
    toast("Updated the time (edit recorded).");
  };
}

/* ---------------- rendering ---------------- */
const main = document.getElementById("main");
let currentTab = "home";
let foodFilterNutrient = "";   // nutrition filter on Foods tab
let foodSearch = "";           // search box text
let foodSort = "default";      // "default" | "az"
let foodAgeBand = "";          // "" | 6m | 6-9m | 9-12m | 12m+
let foodShowAllergens = true;  // include allergens in the Foods list
let trackerMonthISO = "";      // first-of-month anchor for the Tracker calendar ("" = current)
let trackerSelDayISO = "";     // selected day in the Tracker calendar

function fillHeader(){
  const nm=document.getElementById("babyNameTop"); if(nm) nm.textContent = S.baby.name || "Baby";
  const ag=document.getElementById("babyAgeTop"); if(ag) ag.textContent = babyAgeLabel();
}
/* Age label from birthday, rounded to the nearest whole month. */
function babyAgeLabel(){
  const bd = S.baby.birthday;
  if(!bd) return S.baby.ageLabel || "just starting solids";
  const b = new Date(bd); if(isNaN(b)) return S.baby.ageLabel || "just starting solids";
  const now = new Date();
  let months = (now.getFullYear()-b.getFullYear())*12 + (now.getMonth()-b.getMonth());
  // fractional part from day-of-month, to round to nearest whole month
  const dayFrac = (now.getDate()-b.getDate())/30;
  months = Math.round(months + dayFrac);
  if(months < 0) months = 0;
  if(months < 1) return "newborn";
  if(months < 12) return months+" month"+(months!==1?"s":"")+" old";
  const yrs = Math.floor(months/12), rem = months%12;
  return yrs+" yr"+(yrs!==1?"s":"") + (rem?(" "+rem+" mo"):"") + " old";
}

function render(){
  fillHeader();
  const disc = document.getElementById("disclaimer"); if(disc) disc.classList.toggle("hide", S.settings.disclaimerDismissed);
  if(!S.cloud.url) setSyncLabel("", false);

  try{
    if(main) main.onclick = null;   // clear any delegated handler from a prior tab
    if(currentTab==="home") renderHome();
    else if(currentTab==="foods") renderFoods();
    else if(currentTab==="plan") renderPlan();
    else if(currentTab==="tracker") renderLog();
    else if(currentTab==="pantry") renderPantry();
    else if(currentTab==="settings") renderSettings();
    else renderHome();
  }catch(err){
    if(main) main.innerHTML = `<div class="card"><h3>⚠️ Something hiccuped on this screen</h3>
      <p class="muted">The app caught an error so it didn't go blank. This helps us fix it:</p>
      <pre style="background:#fdecec;color:#7a2f28;padding:10px;border-radius:8px;overflow-x:auto;font-size:12px;white-space:pre-wrap">${esc(String(err&&err.stack||err))}</pre>
      <p class="muted">Your saved data is safe. Try another tab, or screenshot this and send it over.</p></div>`;
    console.error("render error:", err);
  }
}

/* ---------- HOME (dashboard) ---------- */
function renderHome(){
  const introduced = introducedFoods();
  const started = startedFoods();
  const totalFoods = FOODS.length + ALLERGENS.length;
  const pct = Math.min(100, Math.round((introduced.length / 12) * 100)); // ~12 as an early milestone

  // most recent feedings across all weeks (from the day-of-week ticks)
  const recentMap = {}; // name -> { name, emoji, isAllergen, group, lastFed, count }
  S.weeks.forEach(w=> Object.entries(w.intros||{}).forEach(([name,it])=>{
    const fedTimes = Object.values(it.dow||{}).filter(d=>d&&d.on).map(d=>d.fedISO||d.at).filter(Boolean);
    if(!fedTimes.length) return;
    const info = itemByName(name) || {};
    const last = fedTimes.sort((a,b)=>b.localeCompare(a))[0];
    const cur = recentMap[name];
    if(!cur){ recentMap[name] = { name, emoji: it.emoji||info.emoji||"🍽️", isAllergen: it.isAllergen, group: info.group, lastFed: last, count: timesEaten(name) }; }
    else if(last > cur.lastFed){ cur.lastFed = last; }
  }));
  const recent = Object.values(recentMap).sort((a,b)=>(b.lastFed||"").localeCompare(a.lastFed||""));

  let html = `<div class="card hero">
    <div class="hero-img">${recent[0]?recent[0].emoji:"🥣"}</div>
    <div class="hero-body">
      <h1>First Bites</h1>
      <p class="sub">Grips and grasps and maybe a taste too. It's all about exploring.</p>
      <div class="prog"><i style="width:${pct}%"></i></div>
      <div class="muted">${started.length} food${started.length!==1?'s':''} started · ${S.weeks.length} week${S.weeks.length!==1?'s':''} planned</div>
    </div>
  </div>`;

  // quick actions
  html += `<div class="row" style="margin-bottom:13px">
    <button class="btn small" data-go="plan">📅 This week's plan</button>
    <button class="btn sec small" data-go="foods">🥑 Browse foods</button>
  </div>`;

  // most recent meals — up to 5 foods, last-fed date, as embedded tiles
  html += `<div class="card"><h2>Most recent meals</h2>`;
  if(!recent.length){
    html += `<p class="muted">Nothing logged yet. Head to <b>Plan</b>, add a food to a week, and tap the day you fed it — it'll show up here.</p>`;
  } else {
    html += `<div class="tiles">`;
    recent.slice(0,5).forEach(r=>{
      html += `<div class="tile" data-prep="${esc(r.name)}">
        <div class="tile-img">${r.emoji}
          <div class="tile-badges"><span class="tile-badge ${r.isAllergen?'allergen':''}">${r.isAllergen?'⚠ allergen':esc(r.group||'food')}</span></div>
        </div>
        <div class="tile-body">
          <div class="tile-name">${esc(titleCase(r.name))}</div>
          <div class="tile-group">Last fed ${fmtStamp(r.lastFed)}</div>
          <div class="tile-group" style="color:var(--green-d);font-weight:700">🍽️ ${r.count} day${r.count!==1?'s':''} total</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  // utility links (Pantry + Setup live here now that the tab bar is 4 tabs)
  html += `<button class="btn small" data-guide="1" style="margin-bottom:10px">📖 General Guide — first-year feeding</button>
  <div class="row">
    <button class="btn sec small" data-go="pantry">🧊 Fridge / Pantry</button>
    <button class="btn sec small" data-go="settings">⚙️ Setup &amp; sync</button>
  </div>`;

  main.innerHTML = html;
  main.onclick = (e)=>{
    const gd=e.target.closest("[data-guide]"); if(gd){ showGeneralGuide(); return; }
    const g=e.target.closest("[data-go]"); if(g){ currentTab=g.dataset.go; setActiveTab(); render(); return; }
    const tile=e.target.closest("[data-prep]"); if(tile){ showPrep(tile.dataset.prep); }
  };
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
      ${S.weeks.slice().sort((a,b)=>b.n-a.n).map(wk=>{
        return `<div class="daychip ${wk.n===S.activeWeek?'active':''}" data-week="${wk.n}">
          Week ${wk.n}<small>${weekRangeLabel(wk.n)}</small></div>`;
      }).join("")}
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn sec small" id="addFoodBtn" style="width:auto">➕ Add a Food To This Week</button>
      <button class="btn sec small" id="addWeek" style="width:auto">➕ Add a New Week</button>
    </div>
  </div>`;

  // week builder: current week header
  html += `<div class="card">
    <div class="dayhead"><h3 style="margin:0">Week ${w.n} · ${weekRangeLabel(w.n)}</h3></div>`;
  if(!(w.foods||[]).length){
    const okCount = buildSuggestions().length;
    html += `<p class="muted" style="margin-top:4px">No foods yet for this week.${okCount?' See <b>Foods to try next</b> below — suggestions based on what '+esc(S.baby.name)+' already tolerates.':' Tap <b>Add a Food To This Week</b> above, or pick from the <b>Foods</b> tab.'}</p>`;
  }
  html += `</div>`;

  // nutrient coverage for this week's foods
  {
    const have = new Set(nutrientCoverage(w.foods||[]).have);
    // Column 1: Vitamins A–E (A, C, D, E, then B vitamins). Columns 2–3: the rest, alphabetical.
    const col1 = ["Vitamin A","Vitamin C","Vitamin D","Vitamin E","B vitamins"];
    const rest = Object.keys(NUTRIENTS).filter(n=>!col1.includes(n)).sort((a,b)=>a.localeCompare(b));
    const col2 = rest.slice(0,5), col3 = rest.slice(5,10);
    const cell = n=>`<div class="nutr-cell ${have.has(n)?'on':''}">${have.has(n)?'✓':'○'} ${NUTRIENTS[n]||''} ${esc(n)}</div>`;
    const colHtml = arr=>`<div class="nutr-col">${arr.map(cell).join("")}</div>`;
    html += `<div class="card"><h3>🥗 Nutrient coverage this week</h3>
      <p class="muted" style="margin:2px 0 8px"><span style="color:var(--green-d);font-weight:700">✓ green</span> = provided by this week's foods · <span style="opacity:.6">○ grey</span> = not yet covered</p>
      <div class="nutr-grid">${colHtml(col1)}${colHtml(col2)}${colHtml(col3)}</div>
      <div class="note" style="margin-top:10px">A quick variety check — not a strict nutrition target. Breast milk/formula still provides most nutrition at this age. Confirm any concerns with your pediatrician.</div>
    </div>`;
  }

  // try-next suggestions based on what's been tried (cross-reactivity-informed)
  const sugg = buildSuggestions();
  const toleratedNames = startedFoods();
  if(sugg.length){
    const ok = sugg.filter(s=>s.tier==="ok").slice(0,6);
    const care = sugg.filter(s=>s.tier==="care").slice(0,6);
    // Collapsible: default open only when the week is empty (helps you start);
    // once foods are added it folds up to give the plan room. User's toggle is remembered.
    const defOpen = !(w.foods||[]).length;
    const isOpen = (S.settings.suggOpen===undefined) ? defOpen : !!S.settings.suggOpen;
    html += `<details class="card" id="suggCard" style="border-color:var(--green)" ${isOpen?'open':''}>
      <summary style="font-weight:700;font-size:15px;color:var(--green-d);cursor:pointer">💡 Foods to try next in Week ${w.n} <span class="muted" style="font-weight:500">(${ok.length+care.length} ideas — tap to ${isOpen?'hide':'show'})</span></summary>
      <p class="muted" style="margin-top:8px">Because ${esc(S.baby.name)} has tolerated <b>${toleratedNames.length?toleratedNames.map(esc).join(", "):'some foods'}</b>, here's what allergy cross-reactivity research suggests is lower- or higher-risk to try next. Still introduce one new food at a time and confirm with your pediatrician.</p>`;
    const renderSugg = (s)=>`<div class="check-row"><div class="check-main">
        <div class="check-title">${s.emoji||"🍽️"} ${esc(s.name)}
          ${s.tier==="care"?'<span class="pill allergen">🟡 introduce carefully</span>':'<span class="pill safe">🟢 likely well tolerated</span>'}</div>
        <div class="check-meta">${esc(s.why)}</div>
      </div><button class="btn sec small" style="flex:0 0 auto" data-sugg="${esc(s.name)}" data-se="${esc(s.emoji||'🍽️')}">Add to Week ${w.n}</button></div>`;
    if(ok.length){ html += `<div class="check-meta" style="margin:6px 0;font-weight:600;color:var(--green-d)">🟢 Lower-risk — reassuring to try</div>` + ok.map(renderSugg).join(""); }
    if(care.length){ html += `<div class="check-meta" style="margin:10px 0 6px;font-weight:600;color:var(--red)">🟡 Higher cross-reactivity — introduce one at a time</div>` + care.map(renderSugg).join(""); }
    html += `<div class="note" style="margin-top:8px">🟢 = a <b>low cross-reactivity</b> family (tolerating one is reassuring for the others — e.g. tolerating peanut makes other legumes like soy, lentils, chickpeas low-risk). 🟡 = <b>high cross-reactivity</b> family — tolerating one does <b>not</b> mean the others are safe, so offer each on its own and watch. Rates from Francis et al., J Food Allergy 2020 (FARE).</div>`;
    html += `</details>`;
  }

  // per-food checklist blocks for the week (Day 1/2/3 inside the week)
  (w.foods||[]).forEach(name=>{
    const it = w.intros[name]; if(!it) return;
    const item = itemByName(name);
    html += `<div class="card">
      <div><h3 style="margin:0"><span class="tap-name" data-prep="${esc(name)}" style="text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px">${it.emoji} ${esc(titleCase(name))}</span> ${it.isAllergen?'<span class="pill allergen">Allergen</span>':''}
        ${timesEaten(name)?`<span class="pill safe">Fed ${timesEaten(name)}×</span>`:''}</h3>
        ${item?`<div class="muted" style="margin-top:4px">${(item.nutrients||[]).map(n=>`${NUTRIENTS[n]||''} ${n}`).join(" · ")}</div>`:''}
      </div>
      <div class="btn-row">
        <button class="btn sec small" data-prep2="${esc(name)}">ℹ️ Prep</button>
        <button class="btn danger small" data-reactnew="${esc(name)}">⚠️ Reaction</button>
        <button class="btn danger small" data-rm="${esc(name)}">Remove</button>
      </div>`;
    // Day-of-week checkboxes mapped to this week's real Mon–Sun dates.
    // A ticked day stores { on:true, fedISO, at, by } so the Tracker plots the FEEDING day.
    it.dow = it.dow || {}; // { 0..6 : {on, fedISO, at, by, editedAt, editedBy} }  (0=Sun)
    const dowNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    html += `<div class="muted" style="margin:2px 0 6px">Tap the day you fed ${esc(titleCase(name))}:</div><div class="dow-row">`;
    dowNames.forEach((dn,idx)=>{
      const rec = it.dow[idx];
      const dte = dowDate(w.n, idx);
      html += `<button class="dow-cell ${rec&&rec.on?'on':''}" data-dow="${idx}" data-food="${esc(name)}" title="${dte.toLocaleDateString()}">
        <span class="dow-n">${dn}</span><span class="dow-d">${dte.getDate()}</span></button>`;
    });
    html += `</div>`;
    // ticked days: edit-time only, no timestamp text (details live in the Tracker)
    const ticked = Object.keys(it.dow).filter(k=>it.dow[k]&&it.dow[k].on).map(Number).sort((a,b)=>a-b);
    if(ticked.length){
      html += `<div class="muted" style="margin-top:6px">Fed on: <b>${ticked.map(idx=>dowNames[idx]).join(", ")}</b> <span style="opacity:.7">· edit times in the Tracker</span></div>`;
    }
    // Logged reactions (freeform). The Reaction / Note button is in the top row.
    it.reactList = it.reactList || []; // [{at, by, text, fedISO}]
    if(it.reactList.length){
      html += `<div style="margin-top:6px">`;
      it.reactList.forEach((r,ri)=>{
        html += `<div class="note" style="margin-top:6px;border-color:#f3cfcf;background:#fdecec;color:#7a2f28">
          <div>⚠ ${esc(r.text)||'(no note)'}</div>
          ${r.editedAt?`<div class="editstamp" style="color:#9a5a2a">edited ${fmtStamp(r.editedAt)}</div>`:''}
          <div style="margin-top:5px">
            <button class="pencil" data-noteedit="${ri}" data-nf="${esc(name)}" style="color:#7a2f28">✏️ Edit</button>
            <button class="pencil" data-notedel="${ri}" data-nf="${esc(name)}" style="color:#c0564b">🗑 Delete</button>
          </div></div>`;
      });
      html += `</div>`;
    }
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
    const t = e.target.closest("[data-week],#addWeek,#addFoodBtn,[data-sugg],[data-rm],[data-intro],[data-dow],[data-reactnew],[data-noteedit],[data-notedel],.check-box,[data-react],[data-prep],[data-prep2],[data-edit]");
    if(!t) return;
    if(t.id==="addWeek"){ ensureWeek(S.weeks.length+1); S.activeWeek=S.weeks.length; save(); render(); return; }
    if(t.id==="addFoodBtn"){ currentTab="foods"; setActiveTab(); render(); toast(`Pick foods — they add to Week ${S.activeWeek}`); return; }
    if(t.matches("#weekSel [data-week]")){ S.activeWeek=+t.dataset.week; render(); return; }
    if(t.hasAttribute("data-sugg")){ const it=itemByName(t.dataset.sugg); addFoodToWeek(S.activeWeek,t.dataset.sugg,t.dataset.se,it?it.isAllergen:false); render(); return; }
    if(t.hasAttribute("data-rm")){ if(confirm(`Remove ${t.dataset.rm} from Week ${S.activeWeek}?`)) removeFoodFromWeek(S.activeWeek,t.dataset.rm); return; }
    if(t.hasAttribute("data-intro")){ markIntroduced(S.activeWeek,t.dataset.intro); return; }
    if(t.hasAttribute("data-dow")){ toggleDow(S.activeWeek, t.dataset.food, +t.dataset.dow); return; }
    if(t.hasAttribute("data-reactnew")){ addReaction(S.activeWeek, t.dataset.reactnew); return; }
    if(t.hasAttribute("data-noteedit")){ editReactionText(S.activeWeek, t.dataset.nf, +t.dataset.noteedit); return; }
    if(t.hasAttribute("data-notedel")){ deleteReaction(S.activeWeek, t.dataset.nf, +t.dataset.notedel); return; }
    if(t.classList.contains("check-box")){ toggleCheck(+t.dataset.week,t.dataset.food,+t.dataset.day,t.dataset.item); return; }
    if(t.hasAttribute("data-react")){ logReaction(S.activeWeek,t.dataset.react,+t.dataset.rday); return; }
    if(t.hasAttribute("data-prep")){ showPrep(t.dataset.prep); return; }
    if(t.hasAttribute("data-prep2")){ showPrep(t.dataset.prep2); return; }
    if(t.hasAttribute("data-edit")){ editEventTime(+t.dataset.ew, t.dataset.ef, t.dataset.edit, t.dataset.ek); return; }
  };
  const sc = document.getElementById("suggCard");
  if(sc) sc.ontoggle = ()=>{ S.settings.suggOpen = sc.open; saveLocal(); };
  // Remember which Day blocks the user opens, so a check-off never auto-collapses them.
  S.settings.openDays = S.settings.openDays || {};
  main.querySelectorAll("details[data-dkey]").forEach(dt=>{
    dt.ontoggle = ()=>{ S.settings.openDays[dt.dataset.dkey] = dt.open; saveLocal(); };
  });
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

/* ---------- FOODS (tiles + filters) ---------- */
function renderFoods(){
  const nutOpts = Object.keys(NUTRIENTS).map(n=>`<option value="${n}" ${foodFilterNutrient===n?'selected':''}>${NUTRIENTS[n]} ${n}</option>`).join("");
  const ageOpts = Object.keys(AGE_BANDS).map(a=>`<option value="${a}" ${foodAgeBand===a?'selected':''}>${esc(AGE_BANDS[a])}</option>`).join("");
  let html = `<div class="card"><h2>Foods</h2>
    <p class="muted">Tap a tile for prep info &amp; "More Details", or use <b>Add</b> to put a food into the week you pick below.</p>
    <label>Add foods to</label>
    <select id="weekPick">${S.weeks.map(wk=>`<option value="${wk.n}" ${wk.n===S.activeWeek?'selected':''}>Week ${wk.n} · ${weekRangeLabel(wk.n)}</option>`).join("")}</select>
    <label style="margin-top:10px">Search</label>
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
  const q = foodSearch.trim().toLowerCase();
  list = list.filter(f=>{
    if(foodAgeBand && f.ageBand !== foodAgeBand) return false;
    if(foodFilterNutrient && !(f.nutrients||[]).includes(foodFilterNutrient)) return false;
    if(q){ const hay=[f.name,f.group,(f.nutrients||[]).join(" "),f.ageText,f.tips,f.note].join(" ").toLowerCase(); if(!hay.includes(q)) return false; }
    return true;
  });
  if(foodSort==="az") list.sort((a,b)=>a.name.localeCompare(b.name));

  html += `<p class="muted" style="margin:0 0 10px">${list.length} food${list.length!==1?'s':''}</p>`;
  if(!list.length) html += `<div class="card"><p class="muted">Nothing matches those filters. Clear the search or widen the age group.</p></div>`;

  // TILE GRID — tapping a tile opens prep (with More Details inside)
  html += `<div class="tiles">`;
  list.forEach(f=>{
    const planned = foodInWeek(S.activeWeek, f.name);
    const eaten = timesEaten(f.name);
    html += `<div class="tile" data-prep="${esc(f.name)}">
      <div class="tile-img">${f.emoji}
        <div class="tile-badges">
          <span class="tile-badge ${f.isAllergen?'allergen':''}">${f.isAllergen?'⚠ allergen':esc(f.group)}</span>
          ${f.choke?'<span class="tile-badge choke">⚠ choke</span>':''}
        </div>
      </div>
      <div class="tile-body">
        <div class="tile-name">${esc(titleCase(f.name))}</div>
        <div class="tile-group">👶 ${esc((AGE_BANDS[f.ageBand]||'~6 months').replace(/\s*\(.*\)/,''))}</div>
        <div class="tile-group tile-eaten" style="${eaten?'color:var(--green-d);font-weight:700':'visibility:hidden'}">🍽️ Eaten ${eaten} day${eaten!==1?'s':''}</div>
        <div class="tile-nutr">${(f.nutrients||[]).slice(0,4).map(n=>NUTRIENTS[n]||'').join(" ")}</div>
        <button class="btn ${planned?'sec':''} small tile-btn" data-food="${esc(f.name)}" data-emoji="${f.emoji}" data-fa="${f.isAllergen?1:0}">${planned?'✓ In Week '+S.activeWeek:'➕ Add'}</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  html += `<div class="note">🥄 <b>Choking safety:</b> no honey before 12 months, no whole nuts/grapes/round coins/hard chunks, no cow's milk as a drink before 12 months, no added salt or sugar. Smash berries &amp; quarter tomatoes. Always supervise; keep baby upright.</div>`;
  main.innerHTML = html;

  const si = document.getElementById("foodSearch");
  { const wp=document.getElementById("weekPick"); if(wp) wp.onchange=(e)=>{ S.activeWeek=+e.target.value; saveLocal(); toast(`Adding to Week ${S.activeWeek}`); render(); }; }
  si.oninput = (e)=>{ foodSearch=e.target.value; const pos=e.target.selectionStart; render(); const n=document.getElementById("foodSearch"); if(n){ n.focus(); n.setSelectionRange(pos,pos); } };
  document.getElementById("ageFilter").onchange = (e)=>{ foodAgeBand=e.target.value; render(); };
  document.getElementById("nutFilter").onchange = (e)=>{ foodFilterNutrient=e.target.value; render(); };
  document.getElementById("sortToggle").onclick = ()=>{ foodSort = foodSort==="az"?"default":"az"; render(); };
  document.getElementById("allToggle").onclick = ()=>{ foodShowAllergens = !foodShowAllergens; render(); };
  // Delegation: Add button adds to plan; tapping elsewhere on a tile opens prep.
  main.onclick = (e)=>{
    const addBtn = e.target.closest("[data-food]");
    if(addBtn){ e.stopPropagation(); addFoodToWeek(S.activeWeek, addBtn.dataset.food, addBtn.dataset.emoji, addBtn.dataset.fa==="1"); render(); return; }
    const tile = e.target.closest("[data-prep]");
    if(tile){ showPrep(tile.dataset.prep); }
  };
}

/* ---------- PANTRY ---------- */
function renderPantry(){
  let html = `<button class="btn sec small" data-go="home" style="margin-bottom:12px">← Home</button>
    <div class="card"><h2>🧊 Fridge / Pantry</h2>
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
  document.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>{ currentTab=x.dataset.go; setActiveTab(); render(); });
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

/* ---------- TRACKER (calendar) ---------- */
/* Collect every logged event, keyed by the FEEDING day (YYYY-MM-DD).
   New model: it.dow[idx]={on,fedISO,at,by}, it.reactList=[{fedISO,at,by,text}].
   The record timestamp (at) is kept in each event's detail. Legacy checks/reactions
   are still read so older/recovered data continues to show. */
function activityByDay(){
  const map = {}; // dayKey -> { foods:Set, allergen:bool, react:bool, events:[] }
  const dk = iso => { const d=new Date(iso); const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  const bucket = key => (map[key] = map[key] || {foods:new Set(),allergen:false,react:false,events:[]});
  S.weeks.forEach(w=> Object.entries(w.intros||{}).forEach(([name,it])=>{
    // NEW: day-of-week feeding ticks
    Object.entries(it.dow||{}).forEach(([idx,rec])=>{
      if(!rec || !rec.on) return;
      const fed = rec.fedISO || rec.at; if(!fed) return;
      const key = dk(fed); const m = bucket(key);
      m.foods.add(name); if(it.isAllergen) m.allergen=true;
      m.events.push({ fedAt:fed, at:rec.at, by:rec.by, food:name, emoji:it.emoji, isAllergen:it.isAllergen,
        text:"Fed "+titleCase(name), react:false, week:w.n, kind:"dow", ekey:idx, editedAt:rec.editedAt, editedBy:rec.editedBy });
    });
    // NEW: freeform reaction notes
    (it.reactList||[]).forEach((r,ri)=>{
      const fed = r.fedISO || r.at; if(!fed) return;
      const key = dk(fed); const m = bucket(key);
      m.react=true;
      m.events.push({ fedAt:fed, at:r.at, by:r.by, food:name, emoji:it.emoji, isAllergen:it.isAllergen,
        text:"⚠ Reaction: "+(r.text||""), react:true, week:w.n, kind:"reactlist", ekey:ri, editedAt:r.editedAt, editedBy:r.editedBy });
    });
  }));
  return map;
}

function renderLog(){ renderTracker(); }
function renderTracker(){
  const byDay = activityByDay();
  const today = new Date(); today.setHours(0,0,0,0);
  const dkOf = d => { const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  const anchor = trackerMonthISO ? new Date(trackerMonthISO) : new Date(today.getFullYear(), today.getMonth(), 1);
  anchor.setDate(1); anchor.setHours(0,0,0,0);
  const monthName = anchor.toLocaleDateString([], {month:"long", year:"numeric"});

  // grid: start on Sunday
  const first = new Date(anchor); const startOffset = first.getDay(); // 0=Sun
  const gridStart = new Date(first); gridStart.setDate(1 - startOffset);

  let html = `<div class="card"><h2>📈 Tracker</h2>
    <p class="muted">Tap any day to see what ${esc(S.baby.name)} tried. Dots mark logged activity.</p>
    <div class="dayhead" style="margin:10px 0 6px">
      <button class="btn sec small" style="width:auto" data-mon="prev">‹</button>
      <b>${monthName}</b>
      <button class="btn sec small" style="width:auto" data-mon="next">›</button>
    </div>
    <div class="cal-grid cal-dow">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="cal-dow-c">${d}</div>`).join("")}</div>
    <div class="cal-grid">`;
  for(let i=0;i<42;i++){
    const d = new Date(gridStart); d.setDate(gridStart.getDate()+i);
    const inMonth = d.getMonth()===anchor.getMonth();
    const key = dkOf(d);
    const info = byDay[key];
    const isToday = d.getTime()===today.getTime();
    const isSel = trackerSelDayISO===key;
    let dots = "";
    if(info){
      if(info.foods.size) dots += `<i class="dot blue"></i>`;
      if(info.allergen) dots += `<i class="dot orange"></i>`;
      if(info.react) dots += `<i class="dot green"></i>`;
    }
    html += `<button class="cal-cell ${inMonth?'':'dim'} ${isToday?'today':''} ${isSel?'sel':''}" data-day="${key}">
      <span>${d.getDate()}</span><span class="cal-dots">${dots}</span></button>`;
  }
  html += `</div>
    <div class="cal-legend"><span><i class="dot blue"></i> Foods</span><span><i class="dot orange"></i> Allergens</span><span><i class="dot green"></i> Notes</span></div>
  </div>`;

  // selected day detail
  const selKey = trackerSelDayISO || dkOf(today);
  const sel = byDay[selKey];
  const selDate = new Date(selKey+"T00:00:00");
  const selLabel = selDate.toDateString()===today.toDateString() ? "Today" : selDate.toLocaleDateString([], {weekday:"long", month:"short", day:"numeric"});
  html += `<div class="card"><h2 style="margin-bottom:4px">Foods Tried ${esc(selLabel)}</h2>`;
  if(!sel){
    html += `<p class="muted">Nothing logged on this day. Tap a dotted day, or check foods off in the Plan.</p>`;
  } else {
    const foodsThatDay = [...sel.foods];
    html += `<div class="tiles">`;
    foodsThatDay.forEach(name=>{
      const it = itemByName(name) || {};
      const evs = sel.events.filter(e=>e.food===name);
      const firstTime = evs.map(e=>e.fedAt||e.at).sort()[0];
      html += `<div class="tile" data-prep="${esc(name)}">
        <div class="tile-img">${it.emoji||"🍽️"}
          <div class="tile-badges"><span class="tile-badge ${it.isAllergen?'allergen':''}">${it.isAllergen?'⚠ allergen':esc(it.group||'food')}</span></div>
        </div>
        <div class="tile-body"><div class="tile-name">${esc(titleCase(name))}</div>
          <div class="tile-group">${fmtStamp(firstTime)}</div></div>
      </div>`;
    });
    html += `</div>`;
    // nutrient summary for the day
    {
      const cov = nutrientCoverage(foodsThatDay);
      html += `<div style="margin-top:12px"><div class="check-meta" style="font-weight:600;color:var(--green-d);margin-bottom:3px">🥗 Nutrients provided today</div>${nutrPills(cov.have)}
        <div class="check-meta" style="font-weight:600;color:var(--red);margin:10px 0 3px">◦ Not provided today</div>${nutrPills(cov.missing, true)}</div>`;
    }
    // detailed events: sorted by feeding time; show feeding time + record timestamp
    html += `<div style="margin-top:12px">`;
    sel.events.sort((a,b)=>(a.fedAt||a.at||"").localeCompare(b.fedAt||b.at||"")).forEach(e=>{
      html += `<div class="check-row"><div class="check-main">
        <div class="check-title" style="font-weight:500">${e.emoji} ${esc(titleCase(e.food))} — ${esc(e.text)}</div>
        <span class="stamp ${e.react?'react':''}">${esc(e.by)} · ${fmtStamp(e.fedAt||e.at)}</span>
        <button class="pencil" data-edit="${e.kind}" data-ew="${e.week}" data-ef="${esc(e.food)}" data-ek="${esc(e.ekey)}">✏️ edit time</button>
        <div class="check-meta">recorded ${fmtStamp(e.at)}</div>
        ${e.editedAt?`<div class="editstamp">edited by ${esc(e.editedBy||'?')} · ${fmtStamp(e.editedAt)}</div>`:''}
      </div></div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  main.innerHTML = html;
  main.onclick = (e)=>{
    const mon = e.target.closest("[data-mon]");
    if(mon){ const a=new Date(anchor); a.setMonth(a.getMonth()+(mon.dataset.mon==="next"?1:-1)); trackerMonthISO=a.toISOString(); render(); return; }
    const cell = e.target.closest("[data-day]");
    if(cell){ trackerSelDayISO = cell.dataset.day; render(); return; }
    const pen = e.target.closest("[data-edit]");
    if(pen){ editEventTime(+pen.dataset.ew, pen.dataset.ef, pen.dataset.edit, pen.dataset.ek); return; }
    const tile = e.target.closest("[data-prep]");
    if(tile){ showPrep(tile.dataset.prep); return; }
  };
}

/* ---------- SETTINGS ---------- */
function renderSettings(){
  const url = S.cloud.url || "";
  let html = `<button class="btn sec small" data-go="home" style="margin-bottom:12px">← Home</button>`;
  html += `<div class="card"><h2>Baby &amp; parents</h2>
    <label>Baby's name</label><input id="babyName" value="${esc(S.baby.name)}">
    <label>Baby's birthday (age shows in the header, rounded to the nearest month)</label><input type="date" id="babyBirthday" value="${esc(S.baby.birthday||'')}">
    <label>Parent / caregiver names (comma separated)</label><input id="parentsIn" value="${esc(S.baby.parents.join(", "))}">
    <label>Week 1 start date</label><input type="date" id="startDate" value="${isoToLocalDate(S.startDateISO)}">
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
    <label style="margin-top:10px">Restore from a backup file</label>
    <input type="file" id="importFile" accept="application/json,.json">
    <button class="btn danger small" style="margin-top:10px" id="resetBtn">Reset everything</button>
  </div>`;

  // ---- Backups (local snapshots) ----
  const backups = loadBackups();
  html += `<div class="card"><h2>⏱️ Backups</h2>
    <p class="muted">The app automatically snapshots your data before any cloud load or overwrite — so a bad sync can be undone. Tap <b>Revert</b> to restore one (your current data is backed up first, so revert is itself undoable).</p>
    <button class="btn sec small" id="backupNow" style="margin-bottom:8px">📸 Back up now</button>`;
  if(!backups.length){
    html += `<p class="muted">No backups yet.</p>`;
  } else {
    backups.forEach((b,i)=>{
      html += `<div class="listrow"><div class="check-main">
        <div class="check-title" style="font-weight:600">${fmtStamp(b.at)}</div>
        <div class="check-meta">${esc(b.reason)} · ${b.foods} food${b.foods!==1?'s':''} logged</div>
      </div><button class="btn sec small" style="flex:0 0 auto" data-revert="${i}">Revert</button></div>`;
    });
  }
  html += `</div>`;

  main.innerHTML = html;
  document.getElementById("saveProfile").onclick=()=>{
    S.baby.name=document.getElementById("babyName").value.trim()||"Baby";
    S.baby.birthday=document.getElementById("babyBirthday").value||"";
    S.baby.parents=document.getElementById("parentsIn").value.split(",").map(s=>s.trim()).filter(Boolean);
    if(!S.baby.parents.length) S.baby.parents=["Parent 1"];
    if(!S.baby.parents.includes(S.activeParent)) S.activeParent=S.baby.parents[0];
    const dv=document.getElementById("startDate").value; if(dv){ const d=new Date(dv+"T00:00:00"); d.setHours(0,0,0,0); S.startDateISO=d.toISOString(); }
    save(); toast("Saved"); render();
  };
  document.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>{ currentTab=x.dataset.go; setActiveTab(); render(); });
  document.getElementById("saveCloud").onclick=async()=>{
    const newUrl=document.getElementById("cloudUrl").value.trim();
    S.cloud.url=newUrl; saveLocal();
    if(!newUrl){ setSyncLabel("Local only",false); render(); return; }
    makeBackup("before connecting a Sheet");   // always snapshot this device first
    const localFoods=(S.weeks||[]).reduce((a,w)=>a+Object.keys(w.intros||{}).length,0);
    setSyncLabel("Connecting…");
    // peek at the Sheet to see if it already has data
    let sheetHas=false;
    try{ const res=await fetch(newUrl+"?action=load",{method:"GET"}); const j=await res.json();
      sheetHas = !!(j && j.data && (j.data.weeks||j.data.intros)); }catch(e){}
    if(localFoods>0 && sheetHas){
      const useSheet = confirm("Both this device AND the Google Sheet already have data.\n\nOK = use the SHEET's data here (this device's data is backed up first).\nCancel = keep THIS device's data and overwrite the Sheet.");
      if(useSheet){ await cloudPull(); } else { await cloudPush(); toast("Kept this device's data; updated the Sheet."); }
    } else if(sheetHas){
      await cloudPull();   // only the sheet has data → load it
    } else {
      await cloudPush(); toast("Connected — this device's data is now in the Sheet.");
    }
    render();
  };
  document.getElementById("pullCloud").onclick=cloudPull;
  document.getElementById("pushCloud").onclick=async()=>{ await cloudPush(); toast("Saved to Sheet."); };
  { const tb=document.getElementById("tutBtn"); if(tb) tb.onclick=showSetupTutorial; }
  document.getElementById("exportBtn").onclick=()=>{ const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="baby-solids-backup.json"; a.click(); };
  { const bn=document.getElementById("backupNow"); if(bn) bn.onclick=()=>{ makeBackup("manual", true); render(); toast("Backed up."); }; }
  document.querySelectorAll("[data-revert]").forEach(b=>b.onclick=()=>{ if(confirm("Revert to this backup? Your current data is snapshotted first, so you can undo this.")) restoreBackup(+b.dataset.revert); });
  { const imp=document.getElementById("importFile"); if(imp) imp.onchange=(e)=>{
      const file=e.target.files && e.target.files[0]; if(!file) return;
      const r=new FileReader(); r.onload=()=>{ try{
        const data=JSON.parse(r.result); makeBackup("before importing a file", true);
        const url=S.cloud.url; S=Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), data); S.cloud.url=url;
        migrate(); normalizeState(); saveLocal(); render(); toast("Imported backup file.");
      }catch(err){ toast("That file couldn't be read as a backup."); } };
      r.readAsText(file);
    }; }
  document.getElementById("resetBtn").onclick=()=>{ if(confirm("Erase all tracked data on this device? (Your Google Sheet copy stays unless you overwrite it.)")){
    S=JSON.parse(JSON.stringify(DEFAULT_STATE)); migrate(); saveLocal(); render(); toast("Reset."); } };
}

/* ---------------- tabs & boot ---------------- */
function setActiveTab(){ document.querySelectorAll(".bnav").forEach(t=>t.classList.toggle("active", t.dataset.tab===currentTab)); }
document.querySelectorAll(".bnav").forEach(t=>t.onclick=()=>{ currentTab=t.dataset.tab; setActiveTab(); render(); });
{ const d=document.getElementById("dismissDisc"); if(d) d.onclick=()=>{ S.settings.disclaimerDismissed=true; saveLocal(); render(); }; }
{ const s=document.getElementById("syncBtn"); if(s) s.onclick=()=>{ currentTab="settings"; setActiveTab(); render(); }; }

try{ normalizeState(); }catch(e){ console.error("normalize error:", e); }
render();
if(S.cloud.url){ cloudPull(); }
