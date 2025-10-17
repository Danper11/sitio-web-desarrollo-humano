/* ===== Switch de tema (persistente) ===== */
(function themeInit(){
  const saved = localStorage.getItem('aventurra-theme');
  const current = saved || document.body.getAttribute('data-theme') || 'light-pro';
  setTheme(current);

  document.querySelectorAll('.theme-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> setTheme(btn.dataset.theme));
  });

  function setTheme(theme){
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('aventurra-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(b=>{
      b.setAttribute('aria-pressed', String(b.dataset.theme===theme));
    });
  }
})();

/* ===== Menú “Más” compacto ===== */
(function moreMenu(){
  const container = document.querySelector('.menu-more');
  if(!container) return;
  const btn = container.querySelector('.more-btn');
  const menu = container.querySelector('.more-menu');
  function open(){ container.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  function close(){ container.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  btn.addEventListener('click', (e)=>{ e.stopPropagation(); container.classList.contains('open') ? close() : open(); });
  document.addEventListener('click', (e)=>{ if(!container.contains(e.target)) close(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', close));
})();

/* ===== Enlace de WhatsApp ===== */
(function initLinks(){
  const btn = document.getElementById('btn-whatsapp');
  if(btn){
    btn.href = 'https://oem.com.mx/diariodelsur/local/habilitan-whatsapp-para-reportar-a-quienes-tiren-basura-en-tapachula-21652437';
  }
})();

/* ===== Compromiso (localStorage) ===== */
(function compromiso(){
  const BTN = document.getElementById('btn-comprometer');
  const RESET = document.getElementById('btn-reiniciar-compromiso');
  const OUT = document.getElementById('commit-count');
  if(!BTN || !OUT) return;

  const KEY = 'aventurra-commit-count';
  const n = Number(localStorage.getItem(KEY) || '0');
  OUT.textContent = n;

  BTN.addEventListener('click', ()=>{
    const val = Number(localStorage.getItem(KEY) || '0') + 1;
    localStorage.setItem(KEY, String(val));
    OUT.textContent = val;
  });

  RESET?.addEventListener('click', ()=>{
    localStorage.setItem(KEY, '0');
    OUT.textContent = 0;
  });
})();

/* ===== Juego: Flujo Limpio ===== */
const ITEMS = [
  {n:'Periódico', b:'papel', e:'📄'},
  {n:'Caja de cartón', b:'papel', e:'📦'},
  {n:'Cuaderno', b:'papel', e:'📘'},
  {n:'Botella PET', b:'plastico', e:'🧴'},
  {n:'Bolsa', b:'plastico', e:'🛍️'},
  {n:'Vaso desechable', b:'plastico', e:'🥤'},
  {n:'Botella', b:'vidrio', e:'🍾'},
  {n:'Frasco', b:'vidrio', e:'🍯'},
  {n:'Vaso de vidrio', b:'vidrio', e:'🧪'},
  {n:'Cáscara de manzana', b:'organico', e:'🍎'},
  {n:'Restos de ensalada', b:'organico', e:'🥗'},
  {n:'Cáscara de plátano', b:'organico', e:'🍌'},
  {n:'Lata de refresco', b:'metal', e:'🥫'},
  {n:'Tapa metálica', b:'metal', e:'🧲'},
  {n:'Lata de atún', b:'metal', e:'🐟'},
];
const WHY = {
  papel:'El papel limpio se recicla mejor separado del orgánico.',
  plastico:'El PET y plásticos duros van limpios y secos.',
  vidrio:'El vidrio es reciclable; no mezclar con orgánico.',
  organico:'Lo orgánico va a composta; sin plástico o vidrio.',
  metal:'Latas y metales, limpios y secos, van al reciclaje.'
};

// DOM juego
const itemEl = document.getElementById('item');
const bins = [...document.querySelectorAll('.bin')];
const fb = document.getElementById('fb');
const btnStart = document.getElementById('btn-start');
const btnAudio = document.getElementById('btn-audio');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const flowEl = document.getElementById('flow');
const timeText = document.getElementById('time');
const timerPath = document.getElementById('timer-path');
const lvlEl = document.getElementById('lvl');
const livesEls = [document.getElementById('life1'), document.getElementById('life2'), document.getElementById('life3')];

const modal = document.getElementById('result-modal');
const resScore = document.getElementById('res-score');
const resAcc = document.getElementById('res-acc');
const resStreak = document.getElementById('res-streak');
const resTbody = document.getElementById('res-tbody');
const resBadges = document.getElementById('res-badges');
const btnPlayAgain = document.getElementById('play-again');

const confetti = document.getElementById('confetti');
let confCtx;

// Estado
let level=1, time=75, score=0, combo=1, streak=0, maxStreak=0, lives=3, flow=60;
let current=null, mistakes=[], stats=null, timer=null, running=false, wantAudio=false;

function levelTime(){ return level===1?75: level===2?65:55; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function bonusChance(){ return Math.random()<0.15; }
function randItem(){ const base=pick(ITEMS); return {...base, bonus:bonusChance()}; }

function renderItem(){
  if(!current) return;
  itemEl.classList.toggle('bonus', !!current.bonus);
  itemEl.innerHTML = `<span aria-hidden="true">${current.e}</span> ${current.n}${current.bonus?' ✨':''}`;
  itemEl.dataset.bin = current.b;
}
function resetBins(){ bins.forEach(b=> b.classList.remove('accept','reject')); }

function beep(ok=true){
  if(!wantAudio) return;
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sine'; o.frequency.value= ok?820:220; g.gain.value=0.06;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, 120);
  }catch(e){}
}

function vibrate(ms=40){ if('vibrate' in navigator) navigator.vibrate(ms); }

function updateHUD(){
  scoreEl.textContent = score;
  comboEl.textContent = `x${combo}`;
  flowEl.style.width = `${Math.max(0,Math.min(flow,100))}%`;
  timeText.textContent = Math.max(0,time);
  const pct = Math.max(0,time)/levelTime()*100;
  timerPath.setAttribute('stroke-dasharray', `${pct},100`);
  lvlEl.textContent = level;
  livesEls.forEach((el,i)=> el.classList.toggle('full', i<lives));
  missions.forEach(m=>{
    const el = document.getElementById(m.id);
    if(!m.endOnly && m.test() && !m.done){ m.done=true; el.classList.add('done'); }
    if(m.endOnly && !running){ if(m.test() && !m.done){ m.done=true; el.classList.add('done'); } }
  });
}

function nextItem(){ current = randItem(); renderItem(); resetBins(); fb.textContent=''; }

function startLevel(lv=1){
  level=lv; time=levelTime(); score=0; combo=1; streak=0; maxStreak=0; lives=3; flow=60;
  mistakes=[]; stats={papel:{ok:0,no:0}, plastico:{ok:0,no:0}, vidrio:{ok:0,no:0}, organico:{ok:0,no:0}, metal:{ok:0,no:0}};
  missions.forEach(m=> m.done=false);
  running=true; updateHUD(); nextItem();
  clearInterval(timer);
  timer = setInterval(()=>{ time--; updateHUD(); if(time<=0 || lives<=0){ endLevel(); } }, 1000);
}

function endLevel(){
  running=false; clearInterval(timer);
  missions.forEach(m=>{ if(m.endOnly && m.test() && !m.done){ m.done=true; document.getElementById(m.id).classList.add('done'); }});
  const total = (score/10) + mistakes.length;
  const acc = total? Math.round((score/10)/total*100) : 0;
  showResults(acc, (acc>=60 && lives>=1) || level===3);
  if(((acc>=60 && lives>=1) || level===3) && level<3){
    setTimeout(()=> startLevel(level+1), 500);
  }
}

function handle(bin){
  if(!running || !itemEl.dataset.bin) return;
  const ok = bin === itemEl.dataset.bin;
  if(ok){
    streak++; maxStreak=Math.max(maxStreak,streak);
    combo = Math.min(5, 1 + Math.floor(streak/5));
    score += 10 * combo;
    stats[bin].ok++;
    flow = Math.min(100, flow + (2*combo));
    if(current.bonus){ time = Math.min(levelTime(), time + 6); }
    fb.textContent = `✔ Separación limpia${combo>1?` · Combo ${combo}x`:''}`;
    beep(true);
  }else{
    mistakes.push({ item:itemEl.textContent.trim(), elegido:bin, correcto:itemEl.dataset.bin });
    stats[itemEl.dataset.bin].no++;
    streak=0; combo=1; lives = Math.max(0, lives-1); flow = Math.max(0, flow-10);
    fb.textContent = `✖ No va ahí. ${WHY[itemEl.dataset.bin]}`;
    beep(false); vibrate(60);
  }
  updateHUD();
  if(lives<=0){ endLevel(); return; }
  nextItem();
}

/* Misiones */
const missions = [
  { id:'m1', text:'Racha 5', done:false, test:()=> streak>=5 },
  { id:'m2', text:'4 plásticos', done:false, test:()=> stats?.plastico.ok>=4 },
  { id:'m3', text:'1 vida o más', done:false, test:()=> lives>=1, endOnly:true }
];

/* Interacciones */
itemEl.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', itemEl.dataset.bin||''); itemEl.setAttribute('aria-grabbed','true'); });
itemEl.addEventListener('dragend', ()=> itemEl.setAttribute('aria-grabbed','false'));
bins.forEach(bin=>{
  const name = bin.getAttribute('data-bin');
  bin.addEventListener('dragover', e=>{ e.preventDefault(); bin.classList.add('accept'); });
  bin.addEventListener('dragleave', ()=> bin.classList.remove('accept'));
  bin.addEventListener('drop', e=>{ 
    e.preventDefault(); 
    bin.classList.remove('accept'); 
    handle(name); 
  });
  bin.addEventListener('click', ()=> handle(name));
});
itemEl.addEventListener('keydown', e=>{
  const map={'1':'papel','2':'plastico','3':'vidrio','4':'organico','5':'metal'};
  if(map[e.key]){ bins.find(b=>b.dataset.bin===map[e.key])?.classList.add('accept'); setTimeout(()=>bins.forEach(x=>x.classList.remove('accept')),140); handle(map[e.key]); }
});

/* Botones */
btnStart.addEventListener('click', ()=> startLevel(1));
btnAudio.addEventListener('click', (e)=>{
  wantAudio = !wantAudio;
  e.currentTarget.setAttribute('aria-pressed', String(wantAudio));
  e.currentTarget.textContent = wantAudio? 'Sonido ON' : 'Sonido';
});

/* Resultados + Confetti */
function buildTable(){
  resTbody.innerHTML='';
  ['papel','plastico','vidrio','organico','metal'].forEach(m=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${m[0].toUpperCase()+m.slice(1)}</td><td>${stats[m].ok}</td><td>${stats[m].no}</td>`;
    resTbody.appendChild(tr);
  });
}
function buildBadges(acc, pass){
  resBadges.innerHTML='';
  const b = (text, cls)=>{ const span=document.createElement('span'); span.className=`badge ${cls}`; span.textContent=text; resBadges.appendChild(span); };
  if(pass) b('Nivel superado', 'win');
  if(acc>=85) b('Precisión 85%+', 'pro');
  if(maxStreak>=10) b('Racha 10+', 'pro');
  if(stats.plastico.ok>=6) b('Plastic Master', 'win');
}
function openModal(){ modal.showModal(); }
modal.addEventListener('close', ()=> stopConfetti());
modal.querySelector('.close')?.addEventListener('click', ()=> modal.close());
btnPlayAgain.addEventListener('click', (e)=>{ e.preventDefault(); modal.close(); startLevel(1); });

function showResults(acc, pass){
  document.getElementById('res-title').textContent = pass? (level<3?`¡Nivel ${level} superado!`:'¡Run completada!') : 'Nivel terminado';
  resScore.textContent = String(score);
  resAcc.textContent = `${acc}%`;
  resStreak.textContent = String(maxStreak);
  buildTable(); buildBadges(acc, pass); openModal();
  if(pass) launchConfetti();
}

/* Confetti */
let confettiTimer=null, confettiParts=[];
function launchConfetti(){
  confetti.style.display='block';
  if(!confCtx){ confCtx = confetti.getContext('2d'); }
  resizeConfetti();
  confettiParts = Array.from({length:120},()=>({
    x: Math.random()*confetti.width, y: -10, r: Math.random()*6+2,
    c: `hsl(${Math.random()*60+100},80%,60%)`,
    s: Math.random()*2+1, a: Math.random()*Math.PI
  }));
  cancelAnimationFrame(confettiTimer);
  animateConfetti();
}
function animateConfetti(){
  confettiTimer = requestAnimationFrame(animateConfetti);
  confCtx.clearRect(0,0,confetti.width,confetti.height);
  confettiParts.forEach(p=>{
    p.y += p.s; p.x += Math.sin(p.a+=0.02)*1.5;
    confCtx.fillStyle = p.c; confCtx.beginPath(); confettiCtxArc(p);
  });
}
function confettiCtxArc(p){
  confCtx.arc(p.x,p.y,p.r,0,Math.PI*2); confCtx.fill();
}
function stopConfetti(){ cancelAnimationFrame(confettiTimer); confetti.style.display='none'; }
function resizeConfetti(){ confetti.width=innerWidth; confetti.height=innerHeight; }
addEventListener('resize', resizeConfetti);

console.log('AVENTURRRA — listo con espacios para tus imágenes ✅');
