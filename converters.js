const hexDecMap = { a: 10, b: 11, c: 12, d: 13, e: 14, f: 15 };
const decHexMap = ['a', 'b', 'c', 'd', 'e', 'f'];

export function hexToDec(hex) {
  let dec = 0;
  for (let i = 0; i < hex.length; i++) {
    const n = hex.at(-(i + 1)).toLowerCase();
    if (n !== '0') {
      if (n in hexDecMap) dec += hexDecMap[n] * Math.pow(16, i);
      else dec += n * Math.pow(16, i);
    }
  }
  return dec;
}

export function decToHex(dec) {
  let hex = '';
  while (dec > 0) {
    const r = dec % 16;
    if (r > 9) hex = decHexMap[r - 10] + hex;
    else hex = r + hex;
    dec = Math.floor(dec / 16);
  }
  return hex;
}

export function binToDec(bin) {
  let dec = 0;
  for (let i = 0; i < bin.length; i++) {
    if (bin.at(-(i + 1)) === '1') {
      dec += Math.pow(2, i);
    }
  }
  return dec;
}

export function decToBin(dec) {
  let bin = '';
  while (dec > 0) {
    const r = dec % 2;
    bin = r + bin;
    dec = Math.floor(dec / 2);
  }
  return bin;
}
