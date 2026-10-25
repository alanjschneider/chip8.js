import { Cpu } from './Cpu.js';

const cpu = new Cpu();

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

function step() {
  cpu.step();
  console.log(cpu.sp);
  console.log(cpu.pc.toString(16));
}

document.addEventListener(
  'keydown',
  function (e) {
    const key = e.code;
    if (key === 'Space') step();
  },
  false,
);
