/**
 * RNK™ Wasteland HUD - Quick Action Bar
 * Container managing multiple action buttons
 * @module actions/action-bar
 */

import { QuickActionButton } from "./action-button.js";
import { getDefaultActions } from "./default-actions.js";

export class QuickActionBar extends PIXI.Container {
  constructor(token, actions = null) {
    super();
    
    this.token = token;
    this.actions = actions || getDefaultActions(token);
    this.buttons = [];
    this.buttonSize = 32;
    this.spacing = 4;
    
    this.createBar();
  }
  
  createBar() {
    this.actions.forEach((action, index) => {
      const button = new QuickActionButton(action, this.buttonSize);
      button.x = index * (this.buttonSize + this.spacing);
      button.y = 0;
      
      this.buttons.push(button);
      this.addChild(button);
    });
  }
  
  setupHotkeys() {
    this.actions.forEach(action => {
      if (action.hotkey) {
        // Hotkey handling would go here
      }
    });
  }
  
  addAction(action) {
    this.actions.push(action);
    const button = new QuickActionButton(action, this.buttonSize);
    button.x = this.buttons.length * (this.buttonSize + this.spacing);
    button.y = 0;
    
    this.buttons.push(button);
    this.addChild(button);
  }
  
  removeAction(actionId) {
    const index = this.actions.findIndex(a => a.id === actionId);
    if (index === -1) return;
    
    this.actions.splice(index, 1);
    const button = this.buttons[index];
    this.buttons.splice(index, 1);
    
    this.removeChild(button);
    button.destroy();
    
    this.buttons.forEach((btn, i) => {
      btn.x = i * (this.buttonSize + this.spacing);
    });
  }
  
  clear() {
    this.buttons.forEach(btn => {
      this.removeChild(btn);
      btn.destroy();
    });
    this.buttons = [];
    this.actions = [];
  }
  
  destroy(options) {
    this.clear();
    super.destroy(options);
  }
}
