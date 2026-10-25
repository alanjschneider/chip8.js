export class Screen extends Uint8Array {
  static width = 64;
  static height = 32;

  constructor(canvasId) {
    super(Screen.width * Screen.height);
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.cellWidth = Math.floor(this.canvas.width / Screen.width);
    this.cellHeight = Math.floor(this.canvas.height / Screen.height);
    this.start = this.start.bind(this);
  }

  put(x, y, bit) {
    if (x < 0 || x > Screen.width || y < 0 || y > Screen.height) return 0;
    const i = y * Screen.width + x;
    const prev = this[i];
    this[i] ^= bit;
    return prev & bit;
  }

  clear() {
    this.fill(0);
  }

  start() {
    this.render();

    requestAnimationFrame(this.start);
  }

  // scan sceeen content and display it
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.length; i++) {
      if (this[i] & 0x1) {
        const x = i % Screen.width;
        const y = Math.floor(i / Screen.width);
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(
          x * this.cellWidth,
          y * this.cellHeight,
          this.cellWidth,
          this.cellHeight,
        );
      }
    }
  }
}
