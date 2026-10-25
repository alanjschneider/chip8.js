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

import { decToHex } from './converters.js';
import { keyboard } from './keyboard.js';
import { font } from './font.js';

export const Modes = {
  CHIP_8: 0,
  SUPER_CHIP_8: 1,
};

const TIMERS_FPS = 1000 / 60;
const IPF = 700;

export class Cpu {
  constructor(screen, mode = Modes.CHIP_8) {
    this.pc = 0; // 12-bit
    this.sp = 0;
    this.stack = new Uint16Array(16);
    this.registers = new Uint8Array(16);
    this.ram = new Uint8Array(4096);
    this.i = 0; // 16-bit
    this.dt = 0; // delay timer
    this.st = 0; // sound timer
    this.screen = screen;
    this.mode = mode;
    this.draw = false;
    this.#loadFonts();

    this.lastUpdate = 0;
    this.timersAcc = 0;
    this.loop = this.loop.bind(this);
  }

  #loadFonts() {
    let pointer = 0;
    for (const key in font) {
      const letter = font[key];
      for (let i = 0; i < letter.length; i++) {
        this.ram[pointer] = letter[i];
        pointer++;
      }
    }
  }

  #decodeInstruction(opcode) {
    return (opcode & 0xf000) >> 12;
  }

  #loadReg(register, value) {
    this.registers[register] = value;
  }

  #readReg(register) {
    return this.registers[register];
  }

  reset(addr = 0x200) {
    this.pc = addr;
    this.ps = 0;
    this.stack.fill(0);
    this.registers.fill(0);
    this.screen?.clear?.();
  }

  loadProgram(program, addr = 0x200) {
    this.pc = addr;
    this.sp = 0;
    this.stack.fill(0);
    this.ram.fill(0);
    this.registers.fill(0);
    this.screen?.clear?.();

    this.#loadFonts();

    for (let i = 0; i < program.length; i++) {
      this.ram[addr + i] = program[i];
    }
  }

  #fetch() {
    const opcode = (this.ram[this.pc] << 8) | this.ram[this.pc + 1];
    this.pc += 2;
    return opcode;
  }

  step() {
    const opcode = this.#fetch();
    switch (this.#decodeInstruction(opcode)) {
      case 0x0: {
        const subCode = opcode & 0x00ff;
        if (subCode === 0xe0) {
          // 00E0 - CLS
          // Clear the display.
          this.screen.clear();
          this.draw = true;
        } else if (subCode === 0xee) {
          // 00EE - RET
          // Return from a subroutine.
          this.pc = this.stack[--this.sp];
        }
        break;
      }

      // 1nnn - JP addr
      // Jump to location nnn.
      case 0x1: {
        this.pc = opcode & 0x0fff;
        break;
      }

      // 2nnn - CALL addr
      // Call subroutine at nnn.
      case 0x2: {
        this.stack[this.sp++] = this.pc;
        this.pc = opcode & 0x0fff;
        break;
      }

      // 3xkk - SE Vx, byte
      // Skip next instruction if Vx = kk.
      case 0x3: {
        const x = (opcode >> 8) & 0x0f;
        const vx = this.#readReg(x);
        const kk = opcode & 0x00ff;
        if (vx === kk) this.pc += 2;
        break;
      }

      // 4xkk - SNE Vx, byte
      // Skip next instruction if Vx != kk.
      case 0x4: {
        const x = (opcode >> 8) & 0x0f;
        const vx = this.#readReg(x);
        const kk = opcode & 0x00ff;
        if (vx !== kk) this.pc += 2;
        break;
      }

      // 5xy0 - SE Vx, Vy
      // Skip next instruction if Vx = Vy.
      case 0x5: {
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;
        const vx = this.#readReg(x);
        const vy = this.#readReg(y);
        if (vx === vy) this.pc += 2;
        break;
      }

      // 6xkk - LD Vx, byte
      // Set Vx = kk.
      case 0x6: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        this.#loadReg(x, kk);
        break;
      }

      // 7xkk - ADD Vx, byte
      // Set Vx = Vx + kk.
      case 0x7: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        this.#loadReg(x, this.#readReg(x) + kk);
        break;
      }

      case 0x8: {
        const subCode = opcode & 0x000f;
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;

        if (subCode === 0) {
          // 8xy0 - LD Vx, Vy
          // Set Vx = Vy.
          this.#loadReg(x, this.#readReg(y));
        } else if (subCode === 1) {
          // 8xy1 - OR Vx, Vy
          // Set Vx = Vx OR Vy.
          this.#loadReg(x, this.#readReg(x) | this.#readReg(y));
          if (this.mode === Modes.CHIP_8) {
            this.#loadReg(15, 0);
          }
        } else if (subCode === 2) {
          // 8xy2 - AND Vx, Vy
          // Set Vx = Vx AND Vy.
          this.#loadReg(x, this.#readReg(x) & this.#readReg(y));
          if (this.mode === Modes.CHIP_8) {
            this.#loadReg(15, 0);
          }
        } else if (subCode === 3) {
          // 8xy3 - XOR Vx, Vy
          // Set Vx = Vx XOR Vy.
          this.#loadReg(x, this.#readReg(x) ^ this.#readReg(y));
          if (this.mode === Modes.CHIP_8) {
            this.#loadReg(15, 0);
          }
        } else if (subCode === 4) {
          // 8xy4 - ADD Vx, Vy
          // Set Vx = Vx + Vy, set VF = carry.
          const vx = this.#readReg(x);
          const vy = this.#readReg(y);
          const sum = vx + vy;
          this.#loadReg(15, sum > 255);
          this.#loadReg(x, sum);
        } else if (subCode === 5) {
          // 8xy5 - SUB Vx, Vy
          // Set Vx = Vx - Vy, set VF = NOT borrow.
          const vx = this.#readReg(x);
          const vy = this.#readReg(y);
          const sub = vx - vy;
          this.#loadReg(15, vx >= vy);
          this.#loadReg(x, sub);
        } else if (subCode === 6) {
          // 8xy6 - SHR Vx {, Vy}
          // Set Vx = Vx SHR 1.
          if (this.mode === Modes.CHIP_8) {
            const bit = this.#readReg(y) & 0x01;
            this.#loadReg(15, bit);
            const rshift = this.#readReg(y) >> 1;
            this.#loadReg(x, rshift);
          } else if (this.mode === Modes.SUPER_CHIP_8) {
            const bit = this.#readReg(x) & 0x01;
            this.#loadReg(15, bit);
            const rshift = this.#readReg(x) >> 1;
            this.#loadReg(x, rshift);
          }
        } else if (subCode === 7) {
          // 8xy7 - SUBN Vx, Vy
          // Set Vx = Vy - Vx, set VF = NOT borrow.
          const vx = this.#readReg(x);
          const vy = this.#readReg(y);
          const sub = vy - vx;
          this.#loadReg(15, vy >= vx);
          this.#loadReg(x, sub);
        } else if (subCode === 14) {
          // 8xyE - SHL Vx {, Vy}
          // Set Vx = Vx SHL 1.
          if (this.mode === Modes.CHIP_8) {
            const bit = (this.#readReg(y) >> 7) & 0x01;
            this.#loadReg(15, bit);
            const lshift = this.#readReg(y) << 1;
            this.#loadReg(x, lshift);
          } else if (this.mode === Modes.SUPER_CHIP_8) {
            const bit = (this.#readReg(x) >> 7) & 0x01;
            this.#loadReg(15, bit);
            const lshift = this.#readReg(x) << 1;
            this.#loadReg(x, lshift);
          }
        }
        break;
      }

      // 9xy0 - SNE Vx, Vy
      // Skip next instruction if Vx != Vy.
      case 0x9: {
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;
        if (this.#readReg(x) !== this.#readReg(y)) this.pc += 2;
        break; // i forgot to put break here and i was fighting to find the f*king bug looong time
      }

      // Annn - LD I, addr
      // Set I = nnn.
      case 0xa: {
        const nnn = opcode & 0x0fff;
        this.i = nnn;
        break;
      }

      // Bnnn - JP V0, addr
      // Jump to location nnn + V0.
      case 0xb: {
        const nnn = opcode & 0x0fff;
        const v0 = this.#readReg(0);
        this.pc = v0 + nnn;
        break;
      }

      // Cxkk - RND Vx, byte
      // Set Vx = random byte AND kk.
      case 0xc: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        this.#loadReg(x, Math.floor((Math.random() * 256) & kk));
        break;
      }

      // Dxyn - DRW Vx, Vy, nibble
      // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
      case 0xd: {
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;
        const n = opcode & 0x000f;

        const vx = this.#readReg(x);
        const vy = this.#readReg(y);
        const sprite = this.ram.slice(this.i, this.i + n);

        let collision = 0;

        for (let iy = 0; iy < sprite.length; iy++) {
          for (let ix = 0; ix < 8; ix++) {
            const mask = 0x80 >> ix;
            if (sprite[iy] & mask) {
              collision |= this.screen.put(vx + ix, vy + iy, 1);
            }
          }
        }

        this.#loadReg(15, collision);
        this.draw = true;

        return 0;
      }

      case 0xe: {
        const x = (opcode >> 8) & 0x0f;
        const subCode = opcode & 0x00ff;
        if (subCode == 0x9e) {
          // Ex9E - SKP Vx
          // Skip next instruction if key with the value of Vx is pressed.
          if (keyboard[this.#readReg(x)]) this.pc += 2;
        } else if (subCode == 0xa1) {
          // ExA1 - SKNP Vx
          // Skip next instruction if key with the value of Vx is not pressed.
          if (!keyboard[this.#readReg(x)]) this.pc += 2;
        }
        break; // i forgot to put this break too
      }

      case 0xf: {
        const x = (opcode >> 8) & 0x0f;
        const subCode = opcode & 0x00ff;

        if (subCode === 0x07) {
          // Fx07 - LD Vx, DT
          // Set Vx = delay timer value.
          this.#loadReg(x, this.dt);
        } else if (subCode === 0x0a) {
          // Fx0A - LD Vx, K
          // Wait for a key press, store the value of the key in Vx.
          let pressed = 0;
          for (let key = 0; key < keyboard.length; key++) {
            if (keyboard[key]) {
              this.#loadReg(x, key);
              pressed = 1;
              break;
            }
          }
          // keep waiting for key
          if (!pressed) this.pc -= 2;
        } else if (subCode === 0x15) {
          // Fx15 - LD DT, Vx
          // Set delay timer = Vx.
          this.dt = this.#readReg(x);
        } else if (subCode === 0x18) {
          // Fx18 - LD ST, Vx
          // Set sound timer = Vx.
          this.st = this.#readReg(x);
        } else if (subCode === 0x1e) {
          // Fx1E - ADD I, Vx
          // Set I = I + Vx.
          const sum = this.i + this.#readReg(x);
          this.i = sum & 0xfff;
          this.#loadReg(15, sum > 0xfff);
        } else if (subCode === 0x29) {
          // Fx29 - LD F, Vx
          // Set I = location of sprite for digit Vx.
          this.i = this.#readReg(x) * 5;
        } else if (subCode === 0x33) {
          // Fx33 - LD B, Vx
          // Store BCD representation of Vx in memory locations I, I+1, and I+2.
          let num = this.#readReg(x);
          for (let i = 0; i < 3; i++) {
            const addr = this.i + (2 - i);
            this.ram[addr] = num % 10;
            num = Math.floor(num / 10);
          }
        } else if (subCode === 0x55) {
          // Fx55 - LD [I], Vx
          // Store registers V0 through Vx in memory starting at location I.
          for (let i = 0; i <= x; i++) {
            // this.ram[this.i + i] = this.#readReg(i);
            if (this.mode === Modes.CHIP_8) {
              this.ram[this.i++] = this.#readReg(i);
            } else if (this.mode === Modes.SUPER_CHIP_8) {
              this.ram[this.i + i] = this.#readReg(i);
            }
          }
        } else if (subCode === 0x65) {
          // Fx65 - LD Vx, [I]
          // Read registers V0 through Vx from memory starting at location I.
          for (let i = 0; i <= x; i++) {
            // this.#loadReg(i, this.ram[this.i + i]);
            if (this.mode === Modes.CHIP_8) {
              this.#loadReg(i, this.ram[this.i++]);
            } else if (this.mode === Modes.SUPER_CHIP_8) {
              this.#loadReg(i, this.ram[this.i + i]);
            }
          }
        }
        break;
      }

      default: {
        throw new Error(`Unknown instruction #${decToHex(opcode)} (${opcode})`);
      }
    }
  }

  #updateTimers() {
    if (this.dt > 0) this.dt--;
    if (this.st > 0) this.st--;
  }

  loop() {
    const now = performance.now();
    const delta = now - this.lastUpdate;
    this.lastUpdate = now;

    this.timersAcc += delta;

    while (this.timersAcc >= TIMERS_FPS) {
      this.#updateTimers();
      this.timersAcc -= TIMERS_FPS;
    }

    if (this.pc < this.ram.length) {
      const ipf = Math.round((IPF * delta) / 1000);

      for (let i = 0; i < ipf; i++) {
        this.step();
        if (this.onUpdate) this.onUpdate();
      }
    }

    if (this.draw) {
      this.screen.render();
      this.draw = false;
    }
    requestAnimationFrame(this.loop);
  }
}
