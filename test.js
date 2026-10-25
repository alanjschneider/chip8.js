import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Cpu } from './Cpu.js';

const cpu = new Cpu();

test('00EE - RET: must set pc to the address from the top of stack and decrement SP by 1', () => {
  const program = [
    0x22, // CALL 0x204
    0x04,
    0x60, // v0 = 0x01 (this must no be executed)
    0x01,
    0x61, // v1 = 0x02 (subrutine)
    0x02,
    0x00, // RET
    0xee,
  ];
  cpu.loadProgram(program, 0x200);

  for (let i = 0; i < 6; i += 2) {
    cpu.step();
  }

  assert.equal(cpu.registers[0x00], 0x00); // v0
  assert.equal(cpu.registers[0x01], 0x02); // v1
  assert.equal(cpu.sp, 0x0);
  assert.equal(cpu.pc, 0x202);
});

test('1nnn - JP addr: must set pc to nnn', () => {
  const program = [0x13, 0x00];
  cpu.loadProgram(program, 0x200);

  for (let i = 0; i < program.length; i += 2) {
    cpu.step();
  }

  assert.equal(cpu.pc, 0x0300);
});

test('2nnn - CALL addr: must push current pc on top of the stack then increment sp by 1 and set pc to nnn + 2', () => {
  const program = [0x21, 0x11];
  cpu.loadProgram(program, 0x200);

  for (let i = 0; i < program.length; i += 2) {
    cpu.step();
  }

  assert.equal(cpu.stack[cpu.sp - 1], 0x202);
  assert.equal(cpu.sp, 1);
  assert.equal(cpu.pc, 0x0111);
});

describe('3xkk - SE Vx, byte', () => {
  test('Must increment pc by 2', () => {
    const program = [
      0x60, // v0 = 0x01
      0x01,
      0x30, // SE v0, 0x01
      0x01,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x206);
  });

  test('Must not increment pc', () => {
    const program = [
      0x60, // v0 = 0x01
      0x01,
      0x30, // SE v0, 0x02
      0x02,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x204);
  });
});

describe('4xkk - SNE Vx, byte', () => {
  test('Must increment pc by 2', () => {
    const program = [
      0x60, // v0 = 0x01
      0x01,
      0x40, // SNE v0, 0x02
      0x02,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x206);
  });

  test('Must not increment pc', () => {
    const program = [
      0x60, // v0 = 0x01
      0x01,
      0x40, // SNE v0, 0x02
      0x01,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x204);
  });
});

describe('5xy0 - SE Vx, Vy', () => {
  test('Must increment pc by 2', () => {
    const program = [
      0x60, // v0 = 0x01
      0x01,
      0x61, // v1 = 0x01
      0x01,
      0x50, // SE v0, v1
      0x10,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x208);
  });

  test('Must not increment pc', () => {
    const program = [
      0x60, // v0 = 0x01
      0x01,
      0x61, // v1 = 0x02
      0x02,
      0x50, // SE v0, v1
      0x10,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x206);
  });
});

describe('6xkk - LD Vx, byte', () => {
  test('v0 must be equal to 0x88', () => {
    const program = [
      0x60, // v0 = 0x88
      0x88,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x88);
  });
});

describe('7xkk - ADD Vx, byte', () => {
  test('v0 must be equal to 0xFF', () => {
    const program = [
      0x60, // v0 := 0xf0
      0xf0,
      0x70, // v0 := v0 + 0x0f
      0x0f,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0xff);
  });
});

describe('8xy0 - LD Vx, Vy', () => {
  test('v0 must be equal to v1', () => {
    const program = [
      0x61, // v1 := 0xff
      0xff,
      0x80, // v0 := v1
      0x10,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], cpu.registers[0x01]);
  });
});

describe('8xy1 - OR Vx, Vy', () => {
  test('v0 must be equal to 0xfe', () => {
    const program = [
      0x60, // v0 := 0x0e
      0x0e,
      0x61, // v1 := 0xf0
      0xf0,
      0x80, // vx | vy
      0x11,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0xfe);
  });
});

describe('8xy2 - AND Vx, Vy', () => {
  test('v0 must be equal to 0x0f', () => {
    const program = [
      0x60, // v0 := 0xff
      0xff,
      0x61, // v1 := 0x0f
      0x0f,
      0x80, // vx & vy
      0x12,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x0f);
  });
});

describe('8xy3 - XOR Vx, Vy', () => {
  test('v0 must be equal to 0xf0', () => {
    const program = [
      0x60, // v0 := 0xff
      0xff,
      0x61, // v1 := 0x0f
      0x0f,
      0x80, // vx & vy
      0x13,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0xf0);
  });
});

describe('8xy4 - ADD Vx, Vy', () => {
  test('v0 must be equal to 0x88', () => {
    const program = [
      0x60, // v0 := 0x80
      0x80,
      0x61, // v1 := 0x08
      0x08,
      0x80, // vx := vx + vy
      0x14,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x88);
    assert.equal(cpu.registers[0xf], 0x00);
  });

  test('v0 must be equal to 0x01 and VF must be equal to 0x1', () => {
    const program = [
      0x60, // v0 := 0xff
      0xff,
      0x61, // v1 := 0x02
      0x02,
      0x80, // vx := vx + vy
      0x14,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x01);
    assert.equal(cpu.registers[0xf], 0x01);
  });
});

describe('8xy5 - SUB Vx, Vy', () => {
  test('v0 must be equal to 0x01', () => {
    const program = [
      0x60, // v0 := 0x0f
      0x0f,
      0x61, // v1 := 0x0e
      0x0e,
      0x80, // vx := vx - vy
      0x15,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x01);
    assert.equal(cpu.registers[0xf], 0x01);
  });

  test('v0 must be equal to 0xff and VF must be equel to 0', () => {
    const program = [
      0x60, // v0 := 0x0f
      0x0f,
      0x61, // v1 := 0x10
      0x10,
      0x80, // vx := vx - vy
      0x15,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0xff);
    assert.equal(cpu.registers[0xf], 0x00);
  });
});

describe('8xy6 - SHR Vx {, Vy}', () => {
  test('v0 must be equal to 0x04', () => {
    const program = [
      0x60, // v0 := 0x08
      0x08,
      0x80, // vx := vx >> 1
      0x06,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x04);
    assert.equal(cpu.registers[0xf], 0x00);
  });

  test('v0 must be equal to 0x01', () => {
    const program = [
      0x60, // v0 := 0x02
      0x02,
      0x80, // vx := vx >> 1
      0x16,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x01);
    assert.equal(cpu.registers[0xf], 0x00);
  });

  test('v0 must be equal to 0x00 with VF = 1', () => {
    const program = [
      0x60, // v0 := 0x01
      0x01,
      0x80, // vx := vx >> 1
      0x16,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x00);
    assert.equal(cpu.registers[0xf], 0x01);
  });
});

describe('8xy7 - SUBN Vy, Vx', () => {
  test('v0 must be equal to 0x01 and VF = 1 (NOT borrow)', () => {
    const program = [
      0x60, // v0 := 0x0f
      0x0f,
      0x61, // v1 := 0x10
      0x10,
      0x80, // v0 := v1 - v0
      0x17,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x01);
    assert.equal(cpu.registers[0xf], 0x01);
  });

  test('v0 must be equal to 0xff and VF = 0 (borrow)', () => {
    const program = [
      0x60, // v0 := 0x02
      0x02,
      0x61, // v1 := 0x01
      0x01,
      0x80, // v0 := v1 - v0
      0x17,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0xff);
    assert.equal(cpu.registers[0xf], 0x00);
  });
});

describe('8xyE - SHL Vx {, Vy}', () => {
  test('v0 must be equal to 0x02', () => {
    const program = [
      0x60, // v0 := 0x01
      0x01,
      0x80, // vx := vx << 1
      0x0e,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x02);
    assert.equal(cpu.registers[0xf], 0x00);
  });

  test('v0 must be equal to 0x00 with VF = 1', () => {
    const program = [
      0x60, // v0 := 0x80 (0b1000000)
      0x80,
      0x80, // v0 := v0 << 1
      0x0e,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.registers[0x00], 0x00);
    assert.equal(cpu.registers[0xf], 0x01);
  });
});

describe('9xy0 - SNE Vx, Vy', () => {
  test('Must increment pc by 2', () => {
    const program = [
      0x60, // v0 := 0x0f
      0x0f,
      0x61, // v1 := 0xf0
      0xf0,
      0x90,
      0x10,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x208);
  });

  test('Must not increment pc', () => {
    const program = [
      0x60, // v0 := 0x0f
      0x0f,
      0x61, // v1 := 0x0f
      0x0f,
      0x90,
      0x10,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0x206);
  });
});

describe('Annn - LD I, addr', () => {
  test('I must be equal to 0xc00', () => {
    const program = [
      0xac, // i := 0xc00
      0x00,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.i, 0xc00);
  });
});

describe('Bnnn - JP V0, addr', () => {
  test('PC must be equal to 0xfff', () => {
    const program = [
      0x60, // v0 := 0x01
      0x01,
      0xbf, // pc := v0 + 0xffe
      0xfe,
    ];
    cpu.loadProgram(program, 0x200);

    for (let i = 0; i < program.length; i += 2) {
      cpu.step();
    }

    assert.equal(cpu.pc, 0xfff);
  });
});
