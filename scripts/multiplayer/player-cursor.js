/**
 * RNK™ Wasteland HUD - Player Cursor
 * Displays other players' cursor positions
 * @module multiplayer/player-cursor
 */

export class PlayerCursor extends PIXI.Container {
  constructor(userId, userName, color) {
    super();

    this.userId = userId;
    this.userName = userName;
    this.color = color;
    this.targetX = 0;
    this.targetY = 0;

    this._createCursor();
  }

  _createCursor() {
    const cursor = new PIXI.Graphics();
    cursor.beginFill(this.color, 1);
    cursor.moveTo(0, 0);
    cursor.lineTo(0, 20);
    cursor.lineTo(5, 15);
    cursor.lineTo(10, 20);
    cursor.lineTo(7, 13);
    cursor.lineTo(15, 10);
    cursor.lineTo(0, 0);
    cursor.endFill();
    this.addChild(cursor);

    const label = new PIXI.Text(this.userName, {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      stroke: this.color,
      strokeThickness: 2
    });
    label.position.set(15, 0);
    this.addChild(label);
  }

  moveTo(x, y, smooth = true) {
    this.targetX = x;
    this.targetY = y;

    if (!smooth) {
      this.position.set(x, y);
    }
  }

  update(delta) {
    const speed = 0.3;
    this.x += (this.targetX - this.x) * speed;
    this.y += (this.targetY - this.y) * speed;
  }
}
