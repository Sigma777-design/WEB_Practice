// Практична №4 — стани клавіш: фізична клавіатура, клік мишею, Caps Lock / Num Lock / Scroll Lock
const kb = document.getElementById('keyboard');
const keys = [...kb.querySelectorAll('.key')];

// data-code кожної клавіші дорівнює KeyboardEvent.code (KeyA, Digit1, Minus, NumpadEnter, ShiftLeft ...)
const byCode = {};
keys.forEach(k => (byCode[k.dataset.code] ||= []).push(k));

// Lock-клавіші та їхні індикатори
const LOCKS = { CapsLock: 'led-caps', NumLock: 'led-num', ScrollLock: 'led-scroll' };
const lockState = { CapsLock: false, NumLock: false, ScrollLock: false };

function setLock(code, on) {
  lockState[code] = on;
  (byCode[code] || []).forEach(k => k.classList.toggle('active', on));
  document.getElementById(LOCKS[code]).classList.toggle('on', on);
}

const press   = code => (byCode[code] || []).forEach(k => k.classList.add('pressed'));
const release = code => (byCode[code] || []).forEach(k => k.classList.remove('pressed'));

// ---------- Фізична клавіатура ----------
const downCodes = new Set();                 // які клавіші зараз утримуються
const BROWSER_KEEP = new Set(['F5', 'F11', 'F12']);   // не блокуємо оновлення / повний екран / DevTools

document.addEventListener('keydown', e => {
  // Ctrl/Cmd-комбінації (копіювати, оновити тощо) лишаємо браузеру
  if (!e.ctrlKey && !e.metaKey && !BROWSER_KEEP.has(e.code)) e.preventDefault();

  downCodes.add(e.code);
  press(e.code);

  if (!e.repeat && e.code in LOCKS) {
    // Caps/Num беремо зі справжнього стану клавіатури; Scroll Lock браузери не повідомляють — перемикаємо вручну
    if (e.code === 'ScrollLock') setLock(e.code, !lockState.ScrollLock);
    else setLock(e.code, e.getModifierState(e.code));
  }
});

document.addEventListener('keyup', e => {
  if (e.code in LOCKS && e.code !== 'ScrollLock') setLock(e.code, e.getModifierState(e.code));
  // PrintScreen (Windows) і деякі інші клавіші шлють лише keyup — показуємо коротке натискання
  if (!downCodes.has(e.code)) {
    press(e.code);
    setTimeout(() => release(e.code), 120);
  } else {
    release(e.code);
  }
  downCodes.delete(e.code);
});

// Якщо вікно втратило фокус (Alt+Tab), keyup не прийде — повертаємо всі клавіші в початковий стан
window.addEventListener('blur', () => {
  downCodes.forEach(release);
  downCodes.clear();
  keys.forEach(k => k.classList.remove('pressed'));
});

// ---------- Миша / дотик ----------
let heldKey = null;

kb.addEventListener('pointerdown', e => {
  const key = e.target.closest('.key');
  if (!key) return;
  e.preventDefault();                        // без фокусу на кнопці, щоб Space/Enter не «клікали» її вдруге
  heldKey = key;
  key.classList.add('pressed');
  if (key.dataset.code in LOCKS) setLock(key.dataset.code, !lockState[key.dataset.code]);
});

function releasePointer() {
  if (heldKey) heldKey.classList.remove('pressed');
  heldKey = null;
}
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, releasePointer));
kb.addEventListener('pointerleave', releasePointer);
