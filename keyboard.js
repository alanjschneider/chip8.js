export const keyboard = new Uint8Array(16);

// 1 | 2 | 3 | C
// 4 | 5 | 6 | D
// 7 | 8 | 9 | E
// A | 0 | B | F

// prettier-ignore
const bind = {
  Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 12,
  KeyQ: 4,   KeyW: 5,   KeyE: 6,   KeyR: 13,
  KeyA: 7,   KeyS: 8,   KeyD: 9,   KeyF: 14,
  KeyZ: 10,  KeyX: 0,   KeyC: 11,  KeyV: 15,
};

const keyboardUI = document.getElementById('keyboard');
for (const button of keyboardUI.getElementsByTagName('button')) {
  button.addEventListener(
    'mousedown',
    function (e) {
      keyboard[e.target.id] = 1;
    },
    false,
  );
  button.addEventListener(
    'mouseup',
    function (e) {
      keyboard[e.target.id] = 0;
    },
    false,
  );
}

if (globalThis.document) {
  document.addEventListener(
    'keydown',
    function (e) {
      const key = bind[e.code];
      if (key !== undefined) keyboard[key] = 1;
    },
    false,
  );

  document.addEventListener(
    'keyup',
    function (e) {
      const key = bind[e.code];
      if (key !== undefined) keyboard[key] = 0;
    },
    false,
  );
}
