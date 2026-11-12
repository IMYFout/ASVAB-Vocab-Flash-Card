import { BUILT_IN_WORDS } from "./words.js";

const STORAGE = "vocab_lab_v2";
const DAY = 86400000;
const $ = id => document.getElementById(id);
const safelyParse = value => { try { return JSON.parse(value); } catch { return null; } };
const get = key => { try { return safelyParse(localStorage.getItem(key)); } catch { return null; } };
const set = (key,value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
const normalize = raw => Array.isArray(raw) && raw.length >= 3 ? Array.from({ length:6 },(_,i)=>String(raw[i] ?? "").trim()) : null;
const asDeck = (name,words) => ({name, words});
const initial = () => ({ deck:"asvab", records:{}, custom:{}, stats:{answered:0,correct:0}, version:2 });
let state = initial();
let page="home", studyQueue=[], studyIndex=0, revealed=false, quiz=null, quizSession={answered:0,correct:0,streak:0}, quizMisses=[];
let modalFocus=null, toastTimeout=0;

function validateCustom(raw) {
 if(!raw || typeof raw!=="object" || Array.isArray(raw)) return {};
 const out={};
 for(const [id,deck] of Object.entries(raw).slice(0,30)){
  if(!/^custom_[a-zA-Z0-9_-]{1,80}$/.test(id) || !deck || typeof deck.name!=="string" || !Array.isArray(deck.words) || !deck.words.length || deck.words.length>3000) continue;
  const words=deck.words.map(normalize);
  if(words.some(w=>!w || !w[0])) continue;
  out[id]=asDeck(deck.name.slice(0,80),words);
 }
 return out;
}
function validateRecord(raw) {
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
 const output={};
 for(const [deck,entries] of Object.entries(raw)){
  if(!entries||typeof entries!=="object"||Array.isArray(entries))continue;
  output[deck]={};
  for(const [idx,r] of Object.entries(entries)){
   if(!/^\d+$/.test(idx)||!r||typeof r!=="object")continue;
   output[deck][idx]={
    reps:Math.max(0,Math.min(1000,Number(r.reps)||0)),
    interval:Math.max(0,Math.min(3650,Number(r.interval)||0)),
    due:Math.max(0,Number(r.due)||0),
    lapses:Math.max(0,Number(r.lapses)||0),
    seen:Math.max(0,Number(r.seen)||0)
   };
  }
 }
 return output;
}
function migrateLegacy(){
 const old=get("vocabswipe_progress");
 const oldDecks=get("vocabswipe_customCats");
 const oldCurrent=get("vocabswipe_currentCat");
 if(oldDecks && typeof oldDecks==="object"){
  for(const [id,deck] of Object.entries(oldDecks)){
   if(/^custom_[a-zA-Z0-9_-]{1,80}$/.test(id) && deck && Array.isArray(deck.words)) state.custom[id]=deck;
  }
 }
 state.custom=validateCustom(state.custom);
 if(old && typeof old==="object") for(const [deck,entries] of Object.entries(old)){
  if(!entries||typeof entries!=="object")continue;
  state.records[deck]={};
  for(const [idx,status] of Object.entries(entries)){
   if(!/^\d+$/.test(idx))continue;
   if(status==="mastered") state.records[deck][idx]={reps:3,interval:14,due:Date.now()+14*DAY,lapses:0,seen:1};
   if(status==="review") state.records[deck][idx]={reps:0,interval:0,due:0,lapses:1,seen:1};
  }
 }
 if(oldCurrent==="asvab"||state.custom[oldCurrent])state.deck=oldCurrent;
}
function load(){
 const saved=get(STORAGE);
 if(saved&&saved.version===2){
  state.custom=validateCustom(saved.custom);
  state.records=validateRecord(saved.records);
  state.deck=(saved.deck==="asvab"||state.custom[saved.deck])?saved.deck:"asvab";
  state.stats={answered:Math.max(0,Number(saved.stats?.answered)||0),correct:Math.max(0,Number(saved.stats?.correct)||0)};
 }else migrateLegacy();
}
function save(){if(!set(STORAGE,state)) toast("Unable to save progress. Check browser storage.",true);}
function decks(){return {asvab:asDeck("ASVAB Core · 234 entries",BUILT_IN_WORDS),...state.custom};}
function words(){return decks()[state.deck]?.words||BUILT_IN_WORDS;}
function records(){return state.records[state.deck] ||= {};}
function record(i){return records()[i];}
function status(i){
 const r=record(i);
 if(!r)return "new";
 if(r.due<=Date.now())return "due";
 return r.reps>=3?"mastered":"learning";
}
function summary(){
 const w=words();let learning=0,mastered=0,due=0;
 w.forEach((_,i)=>{const r=record(i);if(r){if(r.reps>=3)mastered++;else learning++;if(r.due<=Date.now())due++;}});
 return {total:w.length,learning,mastered,due,newCount:w.length-learning-mastered};
}
function schedule(i,rating){
 const prev=record(i)||{reps:0,interval:0,due:0,lapses:0,seen:0};
 let reps=prev.reps,interval=prev.interval,lapses=prev.lapses;
 if(rating==="again"){reps=0;interval=1/1440;lapses++;}
 else if(rating==="hard"){reps=Math.max(1,reps);interval=1;}
 else if(rating==="good"){reps++;interval=prev.interval>=1?Math.max(3,Math.round(prev.interval*2.2)):3;}
 else if(rating==="easy"){reps+=2;interval=prev.interval>=1?Math.max(7,Math.round(prev.interval*3)):7;}
 else return;
 records()[i]={reps,interval,due:Date.now()+interval*DAY,lapses,seen:prev.seen+1};
 save();
}
function shuffle(items){const arr=[...items];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function toast(msg,error=false){
 const el=$("toast");el.textContent=msg;el.style.borderColor=error?"var(--red)":"var(--green)";el.classList.add("show");
 clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove("show"),3500);
}
function nav(next){
 if(!["home","study","quiz","library"].includes(next))return;
 page=next;
 document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el.id==="page-"+next));
 document.querySelectorAll(".nav [data-page]").forEach(el=>el.classList.toggle("active",el.dataset.page===next));
 if(next==="home")renderHome();
 if(next==="study"){if(!studyQueue.length)buildStudyQueue();renderStudy();}
 if(next==="quiz"){if(!quiz)newQuestion();renderQuiz();}
 if(next==="library")renderLibrary();
 window.scrollTo({top:0,behavior:"instant"});
}
function renderDecks(){
 const select=$("deck-select");select.replaceChildren();
 for(const [id,deck] of Object.entries(decks())){const option=document.createElement("option");option.value=id;option.textContent=deck.name;select.append(option);}
 select.value=state.deck;
}
function renderHome(){
 const s=summary();$("home-total").textContent=s.total;$("home-learning").textContent=s.learning;
 $("home-mastered").textContent=s.mastered;$("home-due").textContent=s.due;
 $("mastery-bar").style.width=(s.total?Math.round(s.mastered/s.total*100):0)+"%";
 $("mastery-text").textContent=s.mastered+" of "+s.total+" entries mastered · "+s.newCount+" not started · "+s.due+" due for review";
 $("practice-score").textContent=state.stats.answered?(Math.round(state.stats.correct/state.stats.answered*100)+"% all-time accuracy"):"No questions answered yet";
 $("practice-caption").textContent=state.stats.answered?state.stats.correct+" correct answers across "+state.stats.answered+" attempts. Incorrect words will appear again in this session.":"Choose the closest English definition. Incorrect answers return for additional practice.";
}
function studyFilterIndices(){
 const filter=$("study-filter").value;
 return words().map((_,i)=>i).filter(i=>{
  const r=record(i);
  if(filter==="due")return !r||r.due<=Date.now();
  if(filter==="review")return !!r&&(r.lapses>0||r.due<=Date.now());
  if(filter==="mastered")return !!r&&r.reps>=3;
  return true;
 });
}
function buildStudyQueue(){
 studyQueue=shuffle(studyFilterIndices());studyIndex=0;revealed=false;
}
function currentStudyIndex(){return studyQueue[studyIndex];}
function reveal(){
 if(currentStudyIndex()===undefined)return;
 revealed=true;renderStudy();
}
function renderStudy(){
 const idx=currentStudyIndex(), w=idx===undefined?null:words()[idx],body=$("card-body");
 if(!w){body.innerHTML='<div class="word">All caught up.</div><p class="muted">Try another filter or shuffle the deck.</p>';}
 else if(!revealed)body.innerHTML='<div class="type">'+escapeHTML(w[1])+'</div><div class="word">'+escapeHTML(w[0])+'</div><div class="hint">Tap to reveal meaning · Space</div>';
 else body.innerHTML='<div class="type">'+escapeHTML(w[0])+" · "+escapeHTML(w[1])+'</div><div class="definition">'+escapeHTML(w[3]||"Definition unavailable")+'</div><p class="translation">'+escapeHTML(w[2])+'</p><p class="example">'+escapeHTML(w[4])+'</p><p class="synonyms">Synonyms: '+escapeHTML(w[5]||"Not provided")+'</p><div class="hint">Rate your recall to schedule the next review.</div>';
 document.querySelectorAll("[data-rate]").forEach(b=>b.disabled=!revealed||!w);
 $("study-position").textContent=w?(studyIndex+1)+" / "+studyQueue.length:"0 / 0";
 $("study-filter-caption").textContent=studyQueue.length+" matching card(s). Rate cards to update your local review schedule.";
 $("study-previous").disabled=studyIndex===0;
}
function advanceStudy(){
 if(!studyQueue.length)return;
 studyIndex++;
 if(studyIndex>=studyQueue.length){buildStudyQueue();toast("Study round complete. Starting another round.");}
 revealed=false;renderStudy();
}
function makeQuestion(index){
 const entries=words(),correct=entries[index],correctDefinition=correct[3].trim();
 const candidates=shuffle(entries.map((w,i)=>({definition:w[3]?.trim(),index:i})).filter(x=>x.index!==index&&x.definition&&x.definition.toLowerCase()!==correctDefinition.toLowerCase()));
 const used=new Set([correctDefinition.toLowerCase()]);
 const distractors=[];
 for(const c of candidates){if(used.has(c.definition.toLowerCase()))continue;used.add(c.definition.toLowerCase());distractors.push(c.definition);if(distractors.length===3)break;}
 return {index,options:shuffle([correctDefinition,...distractors]),correct:correctDefinition,selected:null};
}
let quizBag=[];
function newQuestion(){
 const w=words();if(w.length<4){quiz=null;return;}
 if(!quizBag.length)quizBag=shuffle(w.map((_,i)=>i));
 const next=quizMisses.length>=2 && quizSession.answered%3===0?quizMisses.shift():quizBag.shift();
 quiz=makeQuestion(next);
}
function renderQuiz(){
 $("quiz-answered").textContent=quizSession.answered;
 $("quiz-correct").textContent=quizSession.correct;
 $("quiz-streak").textContent=quizSession.streak;
 $("quiz-accuracy").textContent=quizSession.answered?Math.round(quizSession.correct/quizSession.answered*100)+"%":"—";
 $("quiz-caption").textContent="QUESTION "+(quizSession.answered+(!quiz?.selected?1:0))+" · SELECT THE CLOSEST MEANING";
 $("quiz-word").textContent=quiz?words()[quiz.index][0]:"Add at least four words to use practice mode.";
 const container=$("quiz-answers");container.replaceChildren();$("quiz-feedback").replaceChildren();$("quiz-next").hidden=!quiz||quiz.selected===null;
 if(!quiz)return;
 quiz.options.forEach((option,i)=>{
  const b=document.createElement("button");b.className="answer";
  if(quiz.selected!==null && option===quiz.correct)b.classList.add("correct");
  if(quiz.selected!==null && option===quiz.selected && option!==quiz.correct)b.classList.add("incorrect");
  b.disabled=quiz.selected!==null;b.setAttribute("aria-label","Option "+(i+1)+": "+option);
  const letter=document.createElement("span");letter.className="letter";letter.textContent="ABCD"[i];
  const value=document.createElement("span");value.textContent=option;
  b.append(letter,value);b.addEventListener("click",()=>answer(option));container.append(b);
 });
 if(quiz.selected!==null){
  const correct=quiz.selected===quiz.correct,w=words()[quiz.index],f=document.createElement("div");
  f.className="feedback "+(correct?"good":"bad");
  const title=document.createElement("strong");title.textContent=correct?"✓ Correct — good recall":"✕ Incorrect — remember this meaning";
  const detail=document.createElement("p");detail.textContent=w[0]+" means “"+w[3]+"”. 中文："+w[2]+". Synonyms: "+(w[5]||"—")+".";
  const example=document.createElement("p");example.className="muted small";example.textContent="Example: "+(w[4]||"—");
  f.append(title,detail,example);$("quiz-feedback").append(f);
 }
}
function answer(option){
 if(!quiz||quiz.selected!==null)return;
 quiz.selected=option;
 const correct=option===quiz.correct;
 quizSession.answered++;state.stats.answered++;
 if(correct){quizSession.correct++;state.stats.correct++;quizSession.streak++;schedule(quiz.index,"good");}
 else {quizSession.streak=0;quizMisses.push(quiz.index);schedule(quiz.index,"again");}
 save();renderQuiz();
}
function resetQuiz(){quizSession={answered:0,correct:0,streak:0};quizMisses=[];quizBag=[];newQuestion();renderQuiz();}
function renderLibrary(){
 const q=$("word-search").value.toLowerCase().trim(),filter=$("library-filter").value,root=$("word-list");
 const matches=words().map((w,i)=>({w,i})).filter(({w,i})=>{
  const r=record(i),s=status(i);
  if(filter==="new" && s!=="new")return false;
  if(filter==="due" && s!=="due")return false;
  if(filter==="learning" && (!r||r.reps>=3))return false;
  if(filter==="mastered" && (!r||r.reps<3))return false;
  return !q||w.join(" ").toLowerCase().includes(q);
 });
 $("library-count").textContent=matches.length+" entries found · Select any word to inspect or study it.";
 root.replaceChildren();
 for(const {w,i} of matches){
  const b=document.createElement("button");b.className="wordrow";
  const left=document.createElement("span");const strong=document.createElement("b");strong.textContent=w[0];
  const small=document.createElement("small");small.textContent=w[2]+" · "+w[3];left.append(strong,small);
  const stateText=document.createElement("span");stateText.className="rowstatus";stateText.textContent=status(i).toUpperCase();
  b.append(left,stateText);b.addEventListener("click",()=>{
   $("study-filter").value="all";studyQueue=[i,...shuffle(words().map((_,j)=>j).filter(j=>j!==i))];studyIndex=0;revealed=false;nav("study");
  });root.append(b);
 }
}
function switchDeck(id){
 if(!decks()[id])return;
 state.deck=id;save();studyQueue=[];quiz=null;quizBag=[];quizMisses=[];quizSession={answered:0,correct:0,streak:0};renderDecks();nav(page);
}
function closeModal(){
 $("modal-root").classList.remove("show");$("modal-root").setAttribute("aria-hidden","true");
 if(modalFocus)modalFocus.focus();
}
function openModal(title,render){
 modalFocus=document.activeElement;$("modal-title").textContent=title;
 const content=$("modal-content");content.replaceChildren();render(content);
 $("modal-root").classList.add("show");$("modal-root").setAttribute("aria-hidden","false");$("modal-close").focus();
}
function para(parent,text){const p=document.createElement("p");p.className="muted small";p.textContent=text;parent.append(p);return p;}
function button(parent,text,handler,kind="secondary"){
 const b=document.createElement("button");b.type="button";b.className=kind;b.textContent=text;b.addEventListener("click",handler);parent.append(b);return b;
}
function settings(){
 openModal("Settings & backup",root=>{
  para(root,"Your data is stored in this browser. Export a backup before changing devices, clearing browser data, or resetting your deck.");
  const controls=document.createElement("div");controls.className="button-row";root.append(controls);
  button(controls,"Export JSON",exportData,"primary");
  button(controls,"Import JSON",importModal);
  button(controls,"Add custom deck",addDeckModal);
  button(controls,"Reset current deck",resetDeck,"ghost danger");
  para(root,"Keyboard: Space flips cards, 1–4 rate recall, and A–D select quiz answers. No account, advertisements or analytics.");
 });
}
function exportData(){
 const data=JSON.stringify({app:"vocab-lab",version:2,exportedAt:new Date().toISOString(),state},null,2);
 const blob=new Blob([data],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="vocab-lab-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast("Backup downloaded. Store it somewhere safe.");
}
function importModal(){
 openModal("Import learning data",root=>{
  para(root,"Paste Vocab Lab v2 backup JSON or original VocabSwipe backup JSON. Import replaces your current local progress; export first.");
  const area=document.createElement("textarea");area.placeholder='{"app":"vocab-lab","version":2,...}';area.setAttribute("aria-label","Backup JSON");root.append(area);
  const controls=document.createElement("div");controls.className="button-row";root.append(controls);
  button(controls,"Import backup",()=>{
   const data=safelyParse(area.value);if(!data || typeof data!=="object"){toast("Invalid JSON.",true);return;}
   if(data.version===2 && data.state){
    const s=data.state;
    if(!s.records||!s.custom||!s.stats){toast("Incomplete backup.",true);return;}
    const custom=validateCustom(s.custom),recordsData=validateRecord(s.records);
    state={version:2,custom,records:recordsData,deck:(s.deck==="asvab"||custom[s.deck])?s.deck:"asvab",stats:{answered:Math.max(0,Number(s.stats.answered)||0),correct:Math.max(0,Number(s.stats.correct)||0)}};
   }else if(data.progress && typeof data.progress==="object"){
    state=initial();state.custom=validateCustom(data.customCats);for(const [deck,entries] of Object.entries(data.progress)){
     state.records[deck]={};if(!entries||typeof entries!=="object")continue;
     for(const [key,val] of Object.entries(entries)){
      if(!/^\d+$/.test(key))continue;
      if(val==="mastered")state.records[deck][key]={reps:3,interval:14,due:Date.now()+14*DAY,lapses:0,seen:1};
      if(val==="review")state.records[deck][key]={reps:0,interval:0,due:0,lapses:1,seen:1};
     }
    }
   }else {toast("Unsupported backup format.",true);return;}
   save();renderDecks();studyQueue=[];quiz=null;closeModal();nav("home");toast("Learning data imported.");
  },"primary");
 });
}
function addDeckModal(){
 openModal("Create a custom deck",root=>{
  para(root,"Paste a JSON array of vocabulary rows: [word, part of speech, Chinese, English definition, example, synonyms]. Minimum 4 entries for quiz mode.");
  const label=document.createElement("label");label.textContent="Deck name";root.append(label);
  const name=document.createElement("input");name.placeholder="My vocabulary deck";name.maxLength=80;root.append(name);
  const label2=document.createElement("label");label2.textContent="Vocabulary JSON";root.append(label2);
  const area=document.createElement("textarea");area.placeholder='[["abate","v.","减轻","to become less intense","The storm abated.","lessen, weaken"]]';root.append(area);
  const controls=document.createElement("div");controls.className="button-row";root.append(controls);
  button(controls,"Save deck",()=>{
   const parsed=safelyParse(area.value);
   if(!name.value.trim() || !Array.isArray(parsed)||!parsed.length||parsed.length>3000){toast("Enter a name and 1–3000 valid vocabulary entries.",true);return;}
   const cleaned=parsed.map(normalize);
   if(cleaned.some(w=>!w||!w[0])){toast("Each entry must be an array with a word, POS and meaning.",true);return;}
   const id="custom_"+Date.now();state.custom[id]=asDeck(name.value.trim(),cleaned);state.deck=id;save();renderDecks();studyQueue=[];quiz=null;closeModal();nav("home");toast("Custom deck created.");
  },"primary");
 });
}
function resetDeck(){
 if(!confirm("Permanently reset learning progress for this deck? Export a backup first."))return;
 state.records[state.deck]={};save();studyQueue=[];quiz=null;closeModal();nav("home");toast("Deck progress reset.");
}
document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>nav(el.dataset.page)));
$("deck-select").addEventListener("change",e=>switchDeck(e.target.value));
$("settings-btn").addEventListener("click",settings);
$("modal-close").addEventListener("click",closeModal);
$("modal-root").addEventListener("click",e=>{if(e.target===$("modal-root"))closeModal();});
$("study-filter").addEventListener("change",()=>{buildStudyQueue();renderStudy();});
$("study-shuffle").addEventListener("click",()=>{buildStudyQueue();renderStudy();toast("Deck shuffled.");});
$("flashcard").addEventListener("click",reveal);
$("flashcard").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();reveal();}});
$("study-previous").addEventListener("click",()=>{if(studyIndex>0){studyIndex--;revealed=false;renderStudy();}});
$("study-next").addEventListener("click",advanceStudy);
document.querySelectorAll("[data-rate]").forEach(b=>b.addEventListener("click",()=>{const i=currentStudyIndex();if(i!==undefined && revealed){schedule(i,b.dataset.rate);advanceStudy();}}));
$("study-speak").addEventListener("click",()=>{
 const i=currentStudyIndex();if(i===undefined||!("speechSynthesis" in window)){toast("Speech unavailable on this device.",true);return;}
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(words()[i][0]);utterance.lang="en-US";utterance.rate=.88;speechSynthesis.speak(utterance);
});
$("quiz-reset").addEventListener("click",resetQuiz);
$("quiz-next").addEventListener("click",()=>{newQuestion();renderQuiz();});
$("word-search").addEventListener("input",renderLibrary);
$("library-filter").addEventListener("change",renderLibrary);
$("library-add").addEventListener("click",addDeckModal);
document.addEventListener("keydown",e=>{
 if($("modal-root").classList.contains("show")){if(e.key==="Escape")closeModal();return;}
 if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
 if(page==="study"){
  if(e.key===" "){e.preventDefault();reveal();}
  if(/^[1-4]$/.test(e.key)){const b=document.querySelectorAll("[data-rate]")[Number(e.key)-1];if(!b.disabled)b.click();}
 }else if(page==="quiz"){
  if(quiz && quiz.selected===null && /^[a-dA-D]$/.test(e.key))$("quiz-answers").children[e.key.toUpperCase().charCodeAt(0)-65]?.click();
  else if(e.key==="Enter" && quiz?.selected!==null)$("quiz-next").click();
 }
});
load();renderDecks();renderHome();buildStudyQueue();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
