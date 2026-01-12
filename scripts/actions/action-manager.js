/**
 * RNK™ Wasteland HUD - Quick Action Manager
 * Manages action bars for all tokens
 * @module actions/action-manager
 */

import { QuickActionBar } from "./action-bar.js";

export class QuickActionManager {
  static bars = new Map();
  
  static show(token, actions = null) {
    if (!token || !token.Display) return;
    
    if (!token.Display.background) {
      console.warn('[RNK™ Wasteland HUD] QuickActionManager.show: token.Display.background is null', token);
      return;
    }
    
    this.hide(token);
    
    const bar = new QuickActionBar(token, actions);
    
    token.Display.addChild(bar);
    
    bar.x = (token.Display.background.width - bar.width) / 2;
    bar.y = token.Display.background.height + 10;
    
    this.bars.set(token.id, bar);
    
    return bar;
  }
  
  static hide(token) {
    const bar = this.bars.get(token.id);
    if (bar) {
      bar.destroy();
      this.bars.delete(token.id);
    }
  }
  
  static toggle(token, actions = null) {
    if (this.bars.has(token.id)) {
      this.hide(token);
    } else {
      this.show(token, actions);
    }
  }
  
  static get(token) {
    return this.bars.get(token.id);
  }
  
  static hideAll() {
    this.bars.forEach((bar, tokenId) => {
      bar.destroy();
    });
    this.bars.clear();
  }
}
