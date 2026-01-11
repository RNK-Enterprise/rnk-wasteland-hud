/**
 * RNK Wasteland HUD - Radial Menu System
 * Circular action wheel for quick token actions
 */

import { DisplaySettings } from "./settings.js";

export class RadialMenu extends PIXI.Container {
  constructor(token, options = {}) {
    super();
    this.token = token;
    this.radius = options.radius || 80;
    this.centerRadius = options.centerRadius || 25;
    this.actions = options.actions || this.getDefaultActions();
    this.isOpen = false;
    this.selectedIndex = -1;
    
    this.interactive = true;
    this.visible = false;
    
    this.createMenu();
  }

  getDefaultActions() {
    // Delegate to the static implementation so callers can use RadialMenu.getDefaultActions(token)
    return RadialMenu.getDefaultActions(this.token);
  }

  /**
   * Static version of getDefaultActions so external callers can obtain the
   * default action descriptors without creating a full RadialMenu instance.
   * The callbacks attempt to resolve the token's `Display` instance and call
   * the instance methods (performAttack, performDefend, etc.) when present.
   */
  static getDefaultActions(token = null) {
    const actions = [];

    // Helper to call an instance method safely
    const callDisplayMethod = (methodName) => {
      return () => {
        try {
          const Display = token?.Display;
          if (Display && typeof Display[methodName] === "function") return Display[methodName]();
          console.warn(`Radial action '${methodName}' invoked but token.Display.${methodName} is not available.`);
        } catch (err) {
          console.error(`Error executing radial action '${methodName}':`, err);
        }
      };
    };

    // Attack action
    actions.push({
      icon: "fas fa-sword",
      label: "Attack",
      color: 0xff4444,
      callback: callDisplayMethod("performAttack")
    });

    // Defend action
    actions.push({
      icon: "fas fa-shield",
      label: "Defend",
      color: 0x4444ff,
      callback: callDisplayMethod("performDefend")
    });

    // Move/Dash action
    actions.push({
      icon: "fas fa-running",
      label: "Dash",
      color: 0x44ff44,
      callback: callDisplayMethod("performDash")
    });

    // Cast Spell (only include if token's actor has spells)
    if (token?.actor?.system?.spells) {
      actions.push({
        icon: "fas fa-magic",
        label: "Cast",
        color: 0xff44ff,
        callback: callDisplayMethod("openSpellList")
      });
    }

    // Use Item
    actions.push({
      icon: "fas fa-backpack",
      label: "Item",
      color: 0xffaa44,
      callback: callDisplayMethod("openInventory")
    });

    // Skills/Abilities
    actions.push({
      icon: "fas fa-fist-raised",
      label: "Ability",
      color: 0x44aaff,
      callback: callDisplayMethod("openAbilities")
    });

    // Rest/Heal
    actions.push({
      icon: "fas fa-heart",
      label: "Rest",
      color: 0xff8888,
      callback: callDisplayMethod("rest")
    });

    // Token Settings
    actions.push({
      icon: "fas fa-cog",
      label: "Config",
      color: 0x888888,
      callback: callDisplayMethod("openConfig")
    });

    return actions;
  }

  createMenu() {
    // Background circle
    this.background = new PIXI.Graphics();
    this.background.beginFill(0x000000, 0.8);
    this.background.drawCircle(0, 0, this.radius + 10);
    this.background.endFill();
    this.addChild(this.background);
    
    // Center button
    this.centerButton = this.createCenterButton();
    this.addChild(this.centerButton);
    
    // Action segments
    this.segments = [];
    const angleStep = (Math.PI * 2) / this.actions.length;
    
    this.actions.forEach((action, index) => {
      const segment = this.createSegment(action, index, angleStep);
      this.segments.push(segment);
      this.addChild(segment);
    });
    
    // Selection indicator
    this.selectionIndicator = new PIXI.Graphics();
    this.addChild(this.selectionIndicator);
  }

  createCenterButton() {
    const container = new PIXI.Container();
    container.interactive = true;
    container.buttonMode = true;
    
    // Circle background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x333333);
    bg.lineStyle(2, 0xffffff, 0.8);
    bg.drawCircle(0, 0, this.centerRadius);
    bg.endFill();
    container.addChild(bg);
    
    // Icon or token image
    if (this.token.actor?.img) {
      const sprite = PIXI.Sprite.from(this.token.actor.img);
      sprite.anchor.set(0.5);
      sprite.width = this.centerRadius * 1.6;
      sprite.height = this.centerRadius * 1.6;
      
      // Circular mask
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawCircle(0, 0, this.centerRadius - 2);
      mask.endFill();
      sprite.mask = mask;
      
      container.addChild(mask);
      container.addChild(sprite);
    }
    
    // Close button on hover
    container.on('click', () => this.close());
    container.on('pointerover', () => {
      bg.clear();
      bg.beginFill(0x555555);
      bg.lineStyle(2, 0xffffff, 1);
      bg.drawCircle(0, 0, this.centerRadius);
      bg.endFill();
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.beginFill(0x333333);
      bg.lineStyle(2, 0xffffff, 0.8);
      bg.drawCircle(0, 0, this.centerRadius);
      bg.endFill();
    });
    
    return container;
  }

  createSegment(action, index, angleStep) {
    const container = new PIXI.Container();
    container.interactive = true;
    container.buttonMode = true;
    
    const startAngle = (angleStep * index) - Math.PI / 2;
    const endAngle = startAngle + angleStep;
    const midAngle = startAngle + angleStep / 2;
    
    // Segment background
    const segment = new PIXI.Graphics();
    this.drawSegment(segment, startAngle, endAngle, action.color, 0.7);
    container.addChild(segment);
    
    // Icon
    const iconRadius = this.centerRadius + (this.radius - this.centerRadius) * 0.65;
    const iconX = Math.cos(midAngle) * iconRadius;
    const iconY = Math.sin(midAngle) * iconRadius;
    
    const icon = new PIXI.Text(action.icon, {
      fontSize: 24,
      fill: 0xffffff
    });
    icon.anchor.set(0.5);
    icon.x = iconX;
    icon.y = iconY;
    container.addChild(icon);
    
    // Label
    const label = new PIXI.Text(action.label, {
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold'
    });
    label.anchor.set(0.5);
    const labelRadius = this.radius - 15;
    label.x = Math.cos(midAngle) * labelRadius;
    label.y = Math.sin(midAngle) * labelRadius;
    container.addChild(label);
    
    // Interactivity
    container.on('pointerover', () => {
      this.selectedIndex = index;
      segment.clear();
      this.drawSegment(segment, startAngle, endAngle, action.color, 1);
      this.updateSelectionIndicator(midAngle);
    });
    
    container.on('pointerout', () => {
      this.selectedIndex = -1;
      segment.clear();
      this.drawSegment(segment, startAngle, endAngle, action.color, 0.7);
      this.selectionIndicator.clear();
    });
    
    container.on('click', () => {
      if (action.callback) action.callback();
      this.close();
    });
    
    container.actionData = action;
    container.startAngle = startAngle;
    container.endAngle = endAngle;
    
    return container;
  }

  drawSegment(graphics, startAngle, endAngle, color, alpha) {
    graphics.beginFill(color, alpha);
    graphics.lineStyle(2, 0xffffff, 0.3);
    
    graphics.moveTo(0, 0);
    graphics.arc(0, 0, this.radius, startAngle, endAngle);
    graphics.lineTo(0, 0);
    
    graphics.endFill();
  }

  updateSelectionIndicator(angle) {
    this.selectionIndicator.clear();
    this.selectionIndicator.lineStyle(4, 0xffffff, 0.8);
    
    const innerRadius = this.centerRadius + 5;
    const outerRadius = this.radius - 5;
    
    this.selectionIndicator.moveTo(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius
    );
    this.selectionIndicator.lineTo(
      Math.cos(angle) * outerRadius,
      Math.sin(angle) * outerRadius
    );
  }

  open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.visible = true;
    
    // Position at token center
    const bounds = this.token.bounds;
    this.x = bounds.width / 2;
    this.y = bounds.height / 2;
    
    // Animate opening
    this.scale.set(0);
    this.alpha = 0;
    
    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      if (!this.isOpen) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutBack(progress);
      
      this.scale.set(eased);
      this.alpha = progress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  close() {
    if (!this.isOpen) return;
    
    const duration = 150;
    const startTime = Date.now();
    const startScale = this.scale.x;
    const startAlpha = this.alpha;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.scale.set(startScale * (1 - progress));
      this.alpha = startAlpha * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isOpen = false;
        this.visible = false;
      }
    };
    
    animate();
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // Action implementations
  async performAttack() {
    if (!this.token.actor) return;
    
    // Get weapons
    const weapons = this.token.actor.items.filter(i => 
      i.type === "weapon" && i.system.equipped
    );
    
    if (weapons.length === 0) {
      ui.notifications.warn("No equipped weapons!");
      return;
    }
    
    if (weapons.length === 1) {
      weapons[0].roll();
    } else {
      // Show weapon selection
      this.showWeaponSelection(weapons);
    }
  }

  async performDefend() {
    ChatMessage.create({
      content: `${this.token.name} takes the Dodge action!`,
      speaker: ChatMessage.getSpeaker({token: this.token})
    });
  }

  async performDash() {
    ChatMessage.create({
      content: `${this.token.name} takes the Dash action!`,
      speaker: ChatMessage.getSpeaker({token: this.token})
    });
  }

  async openSpellList() {
    if (this.token.actor?.sheet) {
      this.token.actor.sheet.render(true, {tab: "spells"});
    }
  }

  async openInventory() {
    if (this.token.actor?.sheet) {
      this.token.actor.sheet.render(true, {tab: "inventory"});
    }
  }

  async openAbilities() {
    if (this.token.actor?.sheet) {
      this.token.actor.sheet.render(true, {tab: "features"});
    }
  }

  async rest() {
    if (!this.token.actor) return;
    
    const restType = await Dialog.confirm({
      title: "Rest",
      content: "<p>What type of rest?</p>",
      yes: () => "short",
      no: () => "long"
    });
    
    if (restType === "short") {
      this.token.actor.shortRest();
    } else if (restType === "long") {
      this.token.actor.longRest();
    }
  }

  async openConfig() {
    new game.RNKDisplays.DisplayConfigApp(this.token).render(true);
  }

  showWeaponSelection(weapons) {
    const buttons = {};
    weapons.forEach(weapon => {
      buttons[weapon.id] = {
        label: weapon.name,
        callback: () => weapon.roll()
      };
    });
    
    new Dialog({
      title: "Select Weapon",
      content: "<p>Choose a weapon to attack with:</p>",
      buttons
    }).render(true);
  }

  destroy(options) {
    this.close();
    super.destroy(options);
  }
}


