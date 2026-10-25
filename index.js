/*
  chip8.js - chip8 emulator
  Copyright (C) 2026  alanjschneider

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Cpu } from './Cpu.js';
import { Screen } from './Screen.js';
import { Dasm } from './dasm.js';

const screen = new Screen('canvas');
const cpu = new Cpu(screen);
// const dasm = new Dasm();

// const registers = document.getElementById('registers').children;

const fileInput = document.getElementById('file');

document.getElementById('load').addEventListener(
  'click',
  function () {
    fileInput.click();
  },
  false,
);

document.getElementById('reset').addEventListener(
  'click',
  function () {
    cpu.reset();
  },
  false,
);

fileInput.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const arrayBuffer = e.target.result;
    const program = new Uint8Array(arrayBuffer);

    cpu.loadProgram(program, 0x200);
    cpu.loop();
    // cpu.onUpdate = function () {
    //   for (let i = 0; i < cpu.registers.length; i++) {
    //     registers[i].children[1].textContent = cpu.registers[i];
    //   }
    //   registers[16].children[1].textContent = cpu.pc;
    // };

    // dasm.loadProgram(program, 0x200);
    // const output = dasm.run();
    // document.getElementById('code').textContent = output;
  };

  reader.readAsArrayBuffer(file);
});

document.addEventListener(
  'keydown',
  function (e) {
    if (e.code === 'Space') {
      cpu.step();
      console.log('registers:', cpu.registers);
      console.log('pc:', cpu.pc);
      console.log('=================');
    }
  },
  false,
);
