/**
 * RNK™ Wasteland HUD - Quick Action Button
 * Individual interactive action button
 * @module actions/action-button
 */

export class QuickActionButton extends PIXI.Container {
  constructor(action, size = 32) {
    super();
    
    this.action = action;
    this.size = size;
    this.isHovered = false;
    
    this.background = null;
    this.icon = null;
    this.tooltip = null;
    
    this.interactive = true;
    this.buttonMode = true;
    
    this.createButton();
    this.setupInteractivity();
  }
  
  createButton() {
    const size = this.size;
    
    this.background = new PIXI.Graphics();
    this.background.lineStyle(2, 0x444444, 1);
    this.background.beginFill(0x2a2a2a, 0.9);
    this.background.drawRoundedRect(0, 0, size, size, 4);
    this.background.endFill();
    
    const style = new PIXI.TextStyle({
      fontFamily: "Arial, sans-serif",
      fontSize: size * 0.5,
      fill: this.action.color || 0xFFFFFF,
      align: "center"
    });
    
    this.icon = new PIXI.Text(this.action.icon || "?", style);
    this.icon.anchor.set(0.5);
    this.icon.x = size / 2;
    this.icon.y = size / 2;
    
    this.addChild(this.background);
    this.addChild(this.icon);
  }
  
  setupInteractivity() {
    this.on("pointerover", () => {
      this.isHovered = true;
      this.background.tint = 0xCCCCCC;
      this.scale.set(1.1);
      this.showTooltip();
    });
    
    this.on("pointerout", () => {
      this.isHovered = false;
      this.background.tint = 0xFFFFFF;
      this.scale.set(1);
      this.hideTooltip();
    });
    
    this.on("pointerdown", () => {
      this.scale.set(0.95);
    });
    
    this.on("pointerup", () => {
      this.scale.set(this.isHovered ? 1.1 : 1);
      this.executeAction();
    });
  }
  
  showTooltip() {
    if (!this.action.label) return;
    
    const style = new PIXI.TextStyle({
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      fill: 0xFFFFFF,
      backgroundColor: 0x000000,
      padding: 4
    });
    
    this.tooltip = new PIXI.Text(this.action.label, style);
    this.tooltip.anchor.set(0.5, 1);
    this.tooltip.x = this.size / 2;
    this.tooltip.y = -5;
    
    this.addChild(this.tooltip);
  }
  
  hideTooltip() {
    if (this.tooltip) {
      this.removeChild(this.tooltip);
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }
  
  async executeAction() {
    if (typeof this.action.callback === "function") {
      await this.action.callback();
    }
    
    this.flash();
  }
  
  flash() {
    const originalTint = this.background.tint;
    this.background.tint = 0xFFFFFF;
    
    setTimeout(() => {
      if (this.background) {
        this.background.tint = originalTint;
      }
    }, 100);
  }
  
  destroy(options) {
    this.hideTooltip();
    if (this.background) this.background.destroy();
    if (this.icon) this.icon.destroy();
    super.destroy(options);
  }
}
