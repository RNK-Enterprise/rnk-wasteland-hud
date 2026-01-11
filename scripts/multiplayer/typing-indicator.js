/**
 * RNK™ Wasteland HUD - Typing Indicator
 * Shows when other players are typing
 * @module multiplayer/typing-indicator
 */

export class TypingIndicator extends PIXI.Container {
  constructor(userName, color) {
    super();

    this.userName = userName;
    this.color = color;
    this.time = 0;

    this._createIndicator();
  }

  _createIndicator() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRoundedRect(0, 0, 150, 30, 5);
    bg.endFill();
    this.addChild(bg);

    const text = new PIXI.Text(`${this.userName} is typing...`, {
      fontFamily: "Arial",
      fontSize: 12,
      fill: this.color
    });
    text.position.set(10, 8);
    this.addChild(text);

    this.dots = new PIXI.Text("", {
      fontFamily: "Arial",
      fontSize: 12,
      fill: this.color
    });
    this.dots.position.set(130, 8);
    this.addChild(this.dots);
  }

  update(delta) {
    this.time += delta * 0.05;
    const dotCount = Math.floor(this.time) % 4;
    this.dots.text = ".".repeat(dotCount);
  }
}
