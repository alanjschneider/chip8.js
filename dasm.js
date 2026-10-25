import { decToHex } from './converters.js';

export class Dasm {
  constructor() {
    this.pc = 0;
    this.ram = new Uint8Array(4096);
    this.run = this.run.bind(this);
  }

  loadProgram(program, addr = 0x200) {
    console.log(`Loading program (${program.length} bytes) on address ${addr}`);

    this.pc = addr;

    for (let i = 0; i < program.length; i++) {
      this.ram[addr + i] = program[i];
    }
  }

  #fetch() {
    const opcode = (this.ram[this.pc] << 8) | this.ram[this.pc + 1];
    this.pc += 2;
    return opcode;
  }

  #decode(opcode) {
    return (opcode >> 12) & 0x000f;
  }

  run() {
    let output = '';

    while (this.pc < this.ram.length) {
      const line = this.pc.toString().padStart(4, '0');
      const opcode = this.#fetch();
      if (opcode === 0) continue;

      const str = this.#execute(opcode);

      output += `${line} 0x${opcode.toString(16).padStart(4, '0')} ${str}\n`;
    }

    return output;
  }

  #execute(opcode) {
    switch (this.#decode(opcode)) {
      case 0x0: {
        const subCode = opcode & 0x00ff;
        if (subCode === 0xe0) {
          // 00E0 - CLS
          // Clear the display.
          return 'CLS';
        } else if (subCode === 0xee) {
          // 00EE - RET
          // Return from a subroutine.
          return 'RET';
        }

        return 'db ' + opcode;
      }

      // 1nnn - JP addr
      // Jump to location nnn.
      case 0x1: {
        const nnn = opcode & 0x0fff;
        return `JP ${nnn}`;
      }

      // 2nnn - CALL addr
      // Call subroutine at nnn.
      case 0x2: {
        const nnn = opcode & 0x0fff;
        return `CALL ${nnn}`;
      }

      // 3xkk - SE Vx, byte
      // Skip next instruction if Vx = kk.
      case 0x3: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        return `SE V${x}, ${kk}`;
      }

      // 4xkk - SNE Vx, byte
      // Skip next instruction if Vx != kk.
      case 0x4: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        return `SNE V${x}, ${kk}`;
      }

      // 5xy0 - SE Vx, Vy
      // Skip next instruction if Vx = Vy.
      case 0x5: {
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;
        return `SE V${x}, V${y}`;
      }

      // 6xkk - LD Vx, byte
      // Set Vx = kk.
      case 0x6: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        return `LD V${x}, ${kk}`;
      }

      // 7xkk - ADD Vx, byte
      // Set Vx = Vx + kk.
      case 0x7: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        return `ADD V${x}, ${kk}`;
      }

      case 0x8: {
        const subCode = opcode & 0x000f;
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;

        if (subCode === 0) {
          // 8xy0 - LD Vx, Vy
          // Set Vx = Vy.
          return `LD V${x}, V${y}`;
        } else if (subCode === 1) {
          // 8xy1 - OR Vx, Vy
          // Set Vx = Vx OR Vy.
          return `OR V${x}, V${y}`;
        } else if (subCode === 2) {
          // 8xy2 - AND Vx, Vy
          // Set Vx = Vx AND Vy.
          return `AND V${x}, V${y}`;
        } else if (subCode === 3) {
          // 8xy3 - XOR Vx, Vy
          // Set Vx = Vx XOR Vy.
          return `XOR V${x}, V${y}`;
        } else if (subCode === 4) {
          // 8xy4 - ADD Vx, Vy
          // Set Vx = Vx + Vy, set VF = carry.
          return `ADD V${x}, V${y}`;
        } else if (subCode === 5) {
          // 8xy5 - SUB Vx, Vy
          // Set Vx = Vx - Vy, set VF = NOT borrow.
          return `SUB V${x}, V${y}`;
        } else if (subCode === 6) {
          // 8xy6 - SHR Vx {, Vy}
          // Set Vx = Vx SHR 1.
          return `SHR V${x}`;
        } else if (subCode === 7) {
          // 8xy7 - SUBN Vx, Vy
          // Set Vx = Vy - Vx, set VF = NOT borrow.
          return `SUBN V${x}, V${y}`;
        } else if (subCode === 14) {
          // 8xyE - SHL Vx {, Vy}
          // Set Vx = Vx SHL 1.
          return `SHL V${x}`;
        }
        break;
      }

      // 9xy0 - SNE Vx, Vy
      // Skip next instruction if Vx != Vy.
      case 0x9: {
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;
        return `SNE V${x}, V${y}`;
      }

      // Annn - LD I, addr
      // Set I = nnn.
      case 0xa: {
        const nnn = opcode & 0x0fff;
        return `LD I, ${nnn}`;
      }

      // Bnnn - JP V0, addr
      // Jump to location nnn + V0.
      case 0xb: {
        const nnn = opcode & 0x0fff;
        return `JP V0, ${nnn}`;
      }

      // Cxkk - RND Vx, byte
      // Set Vx = random byte AND kk.
      case 0xc: {
        const x = (opcode >> 8) & 0x0f;
        const kk = opcode & 0x00ff;
        return `RND V${x}, ${kk}`;
      }

      // Dxyn - DRW Vx, Vy, nibble
      // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
      case 0xd: {
        const x = (opcode >> 8) & 0x0f;
        const y = (opcode >> 4) & 0x0f;
        const n = opcode & 0x000f;
        return `DRW V${x}, V${y}, ${n}`;
      }

      case 0xe: {
        const x = (opcode >> 8) & 0x0f;
        const subCode = opcode & 0x00ff;
        if (subCode == 0x9e) {
          // Ex9E - SKP Vx
          // Skip next instruction if key with the value of Vx is pressed.
          return `SKP V${x}`;
        } else if (subCode == 0xa1) {
          // ExA1 - SKNP Vx
          // Skip next instruction if key with the value of Vx is not pressed.
          return `SKNP V${x}`;
        }
        break;
      }

      case 0xf: {
        const x = (opcode >> 8) & 0x0f;
        const subCode = opcode & 0x00ff;

        if (subCode === 0x07) {
          // Fx07 - LD Vx, DT
          // Set Vx = delay timer value.
          return `LD V${x}, DT`;
        } else if (subCode === 0x0a) {
          // Fx0A - LD Vx, K
          // Wait for a key press, store the value of the key in Vx.
          return `LD V${x}, K`;
        } else if (subCode === 0x15) {
          // Fx15 - LD DT, Vx
          // Set delay timer = Vx.
          return `LD DT, V${x}`;
        } else if (subCode === 0x18) {
          // Fx18 - LD ST, Vx
          // Set sound timer = Vx.
          return `LD ST, V${x}`;
        } else if (subCode === 0x1e) {
          // Fx1E - ADD I, Vx
          // Set I = I + Vx.
          return `ADD I, V${x}`;
        } else if (subCode === 0x55) {
          // Fx55 - LD [I], Vx
          // Store registers V0 through Vx in memory starting at location I.
          return `LD [I], V${x}`;
        } else if (subCode === 0x29) {
          // Fx29 - LD F, Vx
          // Set I = location of sprite for digit Vx.
          return `LD F, V${x}`;
        } else if (subCode === 0x33) {
          // Fx33 - LD B, Vx
          // Store BCD representation of Vx in memory locations I, I+1, and I+2.
          return `LD B, V${x}`;
        } else if (subCode === 0x65) {
          // Fx65 - LD Vx, [I]
          // Read registers V0 through Vx from memory starting at location I.
          return `LD V${x}, [I]`;
        }
        break;
      }

      default: {
        throw new Error(`Unknown instruction #${decToHex(opcode)} (${opcode})`);
      }
    }
  }

  step() {
    const opcode = this.#fetch();
    return this.#execute(opcode);
  }
}
