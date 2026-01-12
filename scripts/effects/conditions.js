/**
 * RNK™ Wasteland HUD - Condition Icons
 * Handles condition/status effect icon creation
 * @module effects/conditions
 */

export class ConditionIcons {
  static createConditionIcon(condition, size = 24) {
    const container = new PIXI.Container();
    
    if (condition.icon) {
      const sprite = PIXI.Sprite.from(condition.icon);
      sprite.width = size;
      sprite.height = size;
      container.addChild(sprite);
      
      if (condition.duration) {
        const durationText = new PIXI.Text(condition.duration, {
          fontSize: 10,
          fill: "#ffffff",
          fontWeight: "bold",
          stroke: "#000000",
          strokeThickness: 2
        });
        durationText.x = size - durationText.width - 2;
        durationText.y = size - durationText.height - 2;
        container.addChild(durationText);
      }
    } else {
      const circle = new PIXI.Graphics();
      circle.beginFill(0xff6600);
      circle.drawCircle(size / 2, size / 2, size / 2);
      circle.endFill();
      container.addChild(circle);
      
      const text = new PIXI.Text(condition.name.charAt(0).toUpperCase(), {
        fontSize: size * 0.6,
        fill: "#ffffff",
        fontWeight: "bold"
      });
      text.anchor.set(0.5);
      text.x = size / 2;
      text.y = size / 2;
      container.addChild(text);
    }
    
    return container;
  }
}
