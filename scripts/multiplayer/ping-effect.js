/**
 * RNK™ Wasteland HUD - Ping Effect
 * Animated ping indicator for multiplayer attention
 * @module multiplayer/ping-effect
 */

export class PingEffect extends PIXI.Container {
  constructor(x, y, color = 0xff0000, label = "") {
    super();

    this.position.set(x, y);
    this.color = color;
    this.label = label;
    this.time = 0;
    this.duration = 2000;

    this._createPing();
  }

  _createPing() {
    this.ring = new PIXI.Graphics();
    this.addChild(this.ring);

    const dot = new PIXI.Graphics();
    dot.beginFill(this.color, 1);
    dot.drawCircle(0, 0, 5);
    dot.endFill();
    this.addChild(dot);

    if (this.label) {
      const text = new PIXI.Text(this.label, {
        fontFamily: "Arial",
        fontSize: 14,
        fill: 0xffffff,
        stroke: this.color,
        strokeThickness: 3,
        fontWeight: "bold"
      });
      text.anchor.set(0.5);
      text.position.set(0, -30);
      this.addChild(text);
    }
  }

  update(delta) {
    this.time += delta * 16.67;

    const progress = this.time / this.duration;
    if (progress >= 1) {
      return true;
    }

    this.ring.clear();
    this.ring.lineStyle(3, this.color, 1 - progress);
    this.ring.drawCircle(0, 0, progress * 100);

    this.alpha = 1 - progress;

    return false;
  }
}
