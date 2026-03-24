/* ═══════════════════════════════════════════════
   VIA — Agent Setup & Call Controller
═══════════════════════════════════════════════ */

/* ─── DOM refs ─── */
const agentNameEl   = document.getElementById('agentName');
const systemPrompt  = document.getElementById('systemPrompt');
const firstMessage  = document.getElementById('firstMessage');
const phoneNumber   = document.getElementById('phoneNumber');
const callBtn       = document.getElementById('callBtn');
const callBtnLabel  = document.getElementById('callBtnLabel');
const endBtn        = document.getElementById('endBtn');

const avatarCircle  = document.getElementById('avatarCircle');
const fillLayer     = document.getElementById('fillLayer');
const initialsText  = document.getElementById('initialsText');
const avatarIcon    = document.getElementById('avatarIcon');
const avatarStatus  = document.getElementById('avatarStatus');
const pulseRings    = document.getElementById('pulseRings');
const connectorRing = document.getElementById('connectorRing');
const liveBadge     = document.getElementById('liveBadge');
const speakBars     = document.getElementById('speakBars');
const avatarRipple  = document.getElementById('avatarRipple');

const dot1 = document.getElementById('dot1');
const dot2 = document.getElementById('dot2');
const dot3 = document.getElementById('dot3');

const timerEl      = document.getElementById('callTimer');
const timerDisplay = document.getElementById('timerDisplay');

const topStatus    = document.getElementById('topStatus');
const statusDot    = topStatus.querySelector('.status-dot');
const statusText   = topStatus.querySelector('.status-text');

const connectOverlay   = document.getElementById('connectOverlay');
const connectTitle     = document.getElementById('connectTitle');
const connectSub       = document.getElementById('connectSub');
const connectMini      = document.getElementById('connectAvatarMini');
const cs               = [1,2,3,4].map(i => document.getElementById('cs'+i));

const fg1 = document.getElementById('fg1');
const fg2 = document.getElementById('fg2');
const fg3 = document.getElementById('fg3');

/* ─── State ─── */
let callState   = 'idle';  // idle | partial | ready | connecting | live | ended
let timerSec    = 0;
let timerHandle = null;
let fillLevel   = 0;       // 0, 1, 2, 3

/* ─── Helpers ─── */
function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function setTopStatus(dot, text) {
  statusDot.className = 'status-dot ' + dot;
  statusText.textContent = text;
}

function setFill(level) {
  fillLevel = level;
  fillLayer.classList.remove('fill-0', 'fill-33', 'fill-66', 'fill-100', 'fill-live');
  const map = { 0: 'fill-0', 1: 'fill-33', 2: 'fill-66', 3: 'fill-100' };
  fillLayer.classList.add(map[level] || 'fill-0');
}

function setDot(dotEl, done) {
  dotEl.classList.toggle('done', done);
}

/* ─── Evaluate field completeness ─── */
function evaluate() {
  const name    = agentNameEl.value.trim();
  const prompt  = systemPrompt.value.trim();
  const firstMsg = firstMessage.value.trim();
  const phone   = phoneNumber.value.trim();

  const n1 = name.length > 0;
  const n2 = prompt.length > 10;
  const n3 = firstMsg.length > 0;
  const n4 = phone.length >= 6;

  /* Fill dots */
  setDot(dot1, n1);
  setDot(dot2, n2);
  setDot(dot3, n3);

  /* Field done classes */
  fg1.classList.toggle('done', n1);
  fg2.classList.toggle('done', n2);
  fg3.classList.toggle('done', n3);

  /* Initials */
  if (n1) {
    const ini = getInitials(name);
    initialsText.textContent = ini;
    connectMini.textContent  = ini;
    initialsText.classList.add('show');
    avatarIcon.style.display = 'none';
    avatarCircle.classList.add('has-name');
  } else {
    initialsText.classList.remove('show');
    avatarIcon.style.display = '';
    avatarCircle.classList.remove('has-name');
    connectMini.textContent = '✦';
  }

  /* Fill level */
  const level = [n1, n2, n3].filter(Boolean).length;
  setFill(level);

  /* Input filled classes */
  agentNameEl.classList.toggle('filled', n1);
  systemPrompt.classList.toggle('filled', n2);
  firstMessage.classList.toggle('filled', n3);
  phoneNumber.classList.toggle('filled', n4);

  /* Readiness */
  const allReady = n1 && n2 && n3;
  const canCall  = allReady && n4;

  if (callState === 'idle' || callState === 'partial') {
    if (allReady) {
      callState = 'ready';
      avatarCircle.classList.add('ready');
      avatarCircle.classList.remove('has-name');
      pulseRings.classList.add('active');
      avatarStatus.textContent = `${name} is ready to call`;
      avatarStatus.className   = 'avatar-status ready';
      setTopStatus('ready', 'Agent ready');
    } else if (level > 0) {
      callState = 'partial';
      avatarCircle.classList.remove('ready');
      pulseRings.classList.remove('active');
      avatarStatus.textContent = `${level}/3 — keep going…`;
      avatarStatus.className   = 'avatar-status';
      setTopStatus('partial', `${level} of 3 fields done`);
    } else {
      callState = 'idle';
      avatarCircle.classList.remove('ready', 'has-name');
      pulseRings.classList.remove('active');
      avatarStatus.textContent = 'Configure your agent below';
      avatarStatus.className   = 'avatar-status';
      setTopStatus('idle', 'Not configured');
    }
  }

  /* Button */
  callBtn.disabled = !canCall;
  callBtnLabel.textContent = canCall
    ? `Call ${phoneNumber.value.trim()}`
    : allReady
      ? 'Enter a phone number to call'
      : 'Activate agent to call';
}

/* ─── Input listeners ─── */
[agentNameEl, systemPrompt, firstMessage, phoneNumber].forEach(el => {
  el.addEventListener('input', () => {
    if (callState !== 'live' && callState !== 'connecting') evaluate();
  });
});

/* ─── Start Call ─── */
callBtn.addEventListener('click', () => {
  if (callBtn.disabled || callState === 'live' || callState === 'connecting') return;
  startCall();
});

async function startCall() {
  callState = 'connecting';

  /* Show overlay */
  connectTitle.textContent = `Connecting ${agentNameEl.value.trim()}…`;
  connectSub.textContent   = 'Initialising AI voice engine';
  cs.forEach(s => s.classList.remove('done', 'active'));
  connectOverlay.classList.add('active');

  /* Avatar → connecting */
  avatarCircle.classList.add('connecting');
  connectorRing.classList.add('spinning');
  pulseRings.classList.remove('active');
  avatarStatus.textContent = 'Connecting…';
  avatarStatus.className   = 'avatar-status';

  /* Step-through animation */
  const steps = [
    { el: cs[0], sub: 'Configuring agent', ms: 900  },
    { el: cs[1], sub: 'Loading voice model', ms: 800 },
    { el: cs[2], sub: 'Establishing connection', ms: 1000 },
    { el: cs[3], sub: `Dialling ${phoneNumber.value.trim()}`, ms: 900 },
  ];

  for (let i = 0; i < steps.length; i++) {
    const { el, sub, ms } = steps[i];
    el.classList.add('active');
    connectSub.textContent = sub;
    await delay(ms);
    el.classList.remove('active');
    el.classList.add('done');
  }

  /* Short pause then go live */
  await delay(400);
  connectOverlay.classList.remove('active');
  goLive();
}

function goLive() {
  callState = 'live';
  const name = agentNameEl.value.trim();

  /* Avatar → live */
  avatarCircle.classList.remove('connecting', 'ready', 'has-name');
  avatarCircle.classList.add('live');
  connectorRing.classList.remove('spinning');
  fillLayer.classList.remove('fill-100');
  fillLayer.classList.add('fill-live');
  pulseRings.classList.add('active');
  liveBadge.classList.add('show');
  speakBars.classList.add('active');

  avatarStatus.textContent = `${name} is live on call`;
  avatarStatus.className   = 'avatar-status live';
  setTopStatus('live', 'Live call');

  /* Buttons */
  callBtn.style.display = 'none';
  endBtn.style.display  = '';

  /* Timer */
  timerSec = 0;
  timerEl.classList.add('show');
  timerHandle = setInterval(() => {
    timerSec++;
    const m = String(Math.floor(timerSec / 60)).padStart(2,'0');
    const s = String(timerSec % 60).padStart(2,'0');
    timerDisplay.textContent = `${m}:${s}`;
  }, 1000);
}

/* ─── End Call ─── */
endBtn.addEventListener('click', endCall);

function endCall() {
  clearInterval(timerHandle);
  callState = 'ready';

  /* Avatar reset */
  avatarCircle.classList.remove('live', 'connecting');
  avatarCircle.classList.add('ready');
  fillLayer.classList.remove('fill-live');
  fillLayer.classList.add('fill-100');
  liveBadge.classList.remove('show');
  speakBars.classList.remove('active');
  pulseRings.classList.add('active');
  connectorRing.classList.remove('spinning');

  const name = agentNameEl.value.trim();
  avatarStatus.textContent = `${name} — call ended (${timerDisplay.textContent})`;
  avatarStatus.className   = 'avatar-status ready';
  setTopStatus('ready', 'Call ended');

  /* Buttons */
  callBtn.style.display = '';
  endBtn.style.display  = 'none';
  timerEl.classList.remove('show');

  /* Re-enable call button */
  callBtn.disabled = false;
  callBtnLabel.textContent = `Call ${phoneNumber.value.trim()} again`;
}

/* ─── Utility ─── */
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/* ─── Init ─── */
evaluate();
