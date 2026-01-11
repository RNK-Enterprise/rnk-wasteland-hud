/**
 * Inventory Quick View
 * Show equipped items, weapons, armor, and quick-use items with icons
 * @module inventory-display
 */

/**
 * Inventory Item Display
 */
export class InventoryItem extends PIXI.Container {
  constructor(itemData, config = {}) {
    super();

    this.itemData = itemData;
    this.config = {
      size: 32,
      showLabel: true,
      showQuantity: true,
      interactive: true,
      ...config
    };

    this.icon = null;
    this.label = null;
    this.quantity = null;
    this.background = null;

    this.interactive = this.config.interactive;
    this.cursor = "pointer";

    this._createDisplay();
    this._setupInteraction();
  }

  async _createDisplay() {
    // Background
    this.background = new PIXI.Graphics();
    this.background.beginFill(0x000000, 0.7);
    this.background.drawRoundedRect(0, 0, this.config.size, this.config.size, 4);
    this.background.endFill();
    this.background.lineStyle(2, this._getRarityColor(), 1);
    this.background.drawRoundedRect(0, 0, this.config.size, this.config.size, 4);
    this.addChild(this.background);

    // Icon
    await this._loadIcon();

    // Quantity badge
    if (this.config.showQuantity && this.itemData.quantity > 1) {
      this.quantity = new PIXI.Text(this.itemData.quantity.toString(), {
        fontFamily: "Arial",
        fontSize: 10,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2,
        fontWeight: "bold"
      });
      this.quantity.position.set(
        this.config.size - this.quantity.width - 2,
        this.config.size - this.quantity.height - 2
      );
      this.addChild(this.quantity);
    }

    // Label
    if (this.config.showLabel) {
      this.label = new PIXI.Text(this.itemData.name, {
        fontFamily: "Arial",
        fontSize: 10,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2
      });
      this.label.position.set(0, this.config.size + 2);
      this.addChild(this.label);
    }
  }

  async _loadIcon() {
    try {
      const iconPath = this.itemData.img || this.itemData.icon || "icons/svg/item-bag.svg";
      const texture = await PIXI.Texture.fromURL(iconPath);
      
      this.icon = new PIXI.Sprite(texture);
      this.icon.width = this.config.size - 4;
      this.icon.height = this.config.size - 4;
      this.icon.position.set(2, 2);
      this.addChild(this.icon);
    } catch (error) {
      console.warn("Failed to load item icon:", this.itemData.img);
    }
  }

  _getRarityColor() {
    const rarity = this.itemData.rarity || "common";
    const colors = {
      common: 0x999999,
      uncommon: 0x00ff00,
      rare: 0x0066ff,
      "very rare": 0x9933ff,
      legendary: 0xff9900,
      artifact: 0xff0000
    };
    return colors[rarity.toLowerCase()] || colors.common;
  }

  _setupInteraction() {
    if (!this.config.interactive) return;

    this.on("pointerover", () => {
      this.background.tint = 0xcccccc;
      this._showTooltip();
    });

    this.on("pointerout", () => {
      this.background.tint = 0xffffff;
      this._hideTooltip();
    });

    this.on("pointerdown", () => {
      this._useItem();
    });

    this.on("rightdown", () => {
      this._showContextMenu();
    });
  }

  _showTooltip() {
    game.tooltip.activate(this, {
      text: this._getTooltipText(),
      direction: "UP"
    });
  }

  _hideTooltip() {
    game.tooltip.deactivate();
  }

  _getTooltipText() {
    let text = `<strong>${this.itemData.name}</strong>`;
    
    if (this.itemData.rarity) {
      text += `<br><em>${this.itemData.rarity}</em>`;
    }
    
    if (this.itemData.description) {
      text += `<br>${this.itemData.description}`;
    }

    if (this.itemData.damage) {
      text += `<br><strong>Damage:</strong> ${this.itemData.damage}`;
    }

    if (this.itemData.ac) {
      text += `<br><strong>AC:</strong> ${this.itemData.ac}`;
    }

    if (this.itemData.equipped) {
      text += `<br><span style="color: green;">Equipped</span>`;
    }

    return text;
  }

  async _useItem() {
    if (!this.itemData.item) return;

    // Try to use the item
    if (this.itemData.item.use) {
      await this.itemData.item.use();
    } else if (this.itemData.item.roll) {
      await this.itemData.item.roll();
    }
  }

  _showContextMenu() {
    const options = [
      {
        name: "Use Item",
        icon: '<i class="fas fa-hand-sparkles"></i>',
        callback: () => this._useItem()
      }
    ];

    if (this.itemData.item?.sheet) {
      options.push({
        name: "Open Sheet",
        icon: '<i class="fas fa-book"></i>',
        callback: () => this.itemData.item.sheet.render(true)
      });
    }

    if (this.itemData.item?.system?.equipped !== undefined) {
      options.push({
        name: this.itemData.equipped ? "Unequip" : "Equip",
        icon: '<i class="fas fa-shield-alt"></i>',
        callback: () => this._toggleEquipped()
      });
    }

    new ContextMenu($(document.body), ".inventory-item", options);
  }

  async _toggleEquipped() {
    if (!this.itemData.item) return;

    await this.itemData.item.update({
      "system.equipped": !this.itemData.equipped
    });
  }
}

/**
 * Inventory Display Container
 */
export class InventoryDisplay extends PIXI.Container {
  constructor(token, config = {}) {
    super();

    this.token = token;
    this.config = {
      showWeapons: true,
      showArmor: true,
      showConsumables: true,
      maxItems: 8,
      itemSize: 32,
      layout: "horizontal", // horizontal, vertical, grid
      ...config
    };

    this.items = [];
    this._createDisplay();
  }

  async _createDisplay() {
    if (!this.token.actor) return;

    const items = this._getDisplayItems();
    let x = 0;
    let y = 0;

    for (const itemData of items) {
      const item = new InventoryItem(itemData, {
        size: this.config.itemSize,
        showLabel: false
      });

      item.position.set(x, y);
      this.addChild(item);
      this.items.push(item);

      // Update position based on layout
      switch (this.config.layout) {
        case "horizontal":
          x += this.config.itemSize + 4;
          break;
        case "vertical":
          y += this.config.itemSize + 4;
          break;
        case "grid":
          x += this.config.itemSize + 4;
          if (x >= (this.config.itemSize + 4) * 4) {
            x = 0;
            y += this.config.itemSize + 4;
          }
          break;
      }

      if (this.items.length >= this.config.maxItems) break;
    }
  }

  _getDisplayItems() {
    if (!this.token.actor) return [];

    const items = [];

    // Get equipped weapons
    if (this.config.showWeapons) {
      const weapons = this.token.actor.items.filter(i => 
        i.type === "weapon" && i.system.equipped
      );
      items.push(...weapons.map(i => this._itemToData(i)));
    }

    // Get equipped armor
    if (this.config.showArmor) {
      const armor = this.token.actor.items.filter(i => 
        i.type === "equipment" && i.system.equipped && i.system.armor?.type
      );
      items.push(...armor.map(i => this._itemToData(i)));
    }

    // Get consumables
    if (this.config.showConsumables) {
      const consumables = this.token.actor.items.filter(i => 
        i.type === "consumable" && i.system.quantity > 0
      );
      items.push(...consumables.map(i => this._itemToData(i)));
    }

    return items.slice(0, this.config.maxItems);
  }

  _itemToData(item) {
    return {
      id: item.id,
      name: item.name,
      img: item.img,
      icon: item.img,
      type: item.type,
      rarity: item.system.rarity,
      description: item.system.description?.value,
      damage: item.system.damage?.parts?.[0]?.[0],
      ac: item.system.armor?.value,
      equipped: item.system.equipped,
      quantity: item.system.quantity || 1,
      item: item
    };
  }

  refresh() {
    this.removeChildren();
    this.items = [];
    this._createDisplay();
  }
}

/**
 * Inventory Display Manager
 */
export class InventoryDisplayManager {
  static displays = new Map();

  /**
   * Create inventory display for token
   */
  static createDisplay(token, config = {}) {
    const key = token.id;
    
    // Remove existing display
    this.removeDisplay(token);

    const display = new InventoryDisplay(token, config);
    
    const Display = token.Display;
    if (Display) {
      // Position below Display content
      display.position.set(0, Display.height + 10);
      Display.addChild(display);
    }

    this.displays.set(key, display);
    return display;
  }

  /**
   * Remove display from token
   */
  static removeDisplay(token) {
    const key = token.id;
    const display = this.displays.get(key);
    
    if (display) {
      display.destroy({ children: true });
      this.displays.delete(key);
    }
  }

  /**
   * Refresh display for token
   */
  static refreshDisplay(token) {
    const display = this.displays.get(token.id);
    if (display) {
      display.refresh();
    }
  }

  /**
   * Get display for token
   */
  static getDisplay(token) {
    return this.displays.get(token.id);
  }

  /**
   * Clear all displays
   */
  static clear() {
    this.displays.forEach(display => display.destroy({ children: true }));
    this.displays.clear();
  }
}

/**
 * Setup function
 */
export function setupInventoryDisplay() {
  console.log("RNK™ Wasteland HUD | Inventory display initialized");

  // Register settings
  game.settings.register("rnk-wasteland-hud", "showInventory", {
    name: "Show Inventory Display",
    hint: "Display equipped items and consumables on token Displays",
    scope: "world",
    config: true,
    type: String,
    choices: {
      never: "Never",
      selected: "When Selected",
      always: "Always",
      hover: "On Hover"
    },
    default: "selected"
  });

  // Refresh on item changes
  Hooks.on("createItem", (item, options, userId) => {
    if (item.parent?.isToken) {
      const token = item.parent.token?.object;
      if (token) {
        InventoryDisplayManager.refreshDisplay(token);
      }
    }
  });

  Hooks.on("updateItem", (item, changes, options, userId) => {
    if (item.parent?.isToken) {
      const token = item.parent.token?.object;
      if (token) {
        InventoryDisplayManager.refreshDisplay(token);
      }
    }
  });

  Hooks.on("deleteItem", (item, options, userId) => {
    if (item.parent?.isToken) {
      const token = item.parent.token?.object;
      if (token) {
        InventoryDisplayManager.refreshDisplay(token);
      }
    }
  });

  // Clear on tear down
  Hooks.on("canvasTearDown", () => {
    InventoryDisplayManager.clear();
  });

  // Chat command
  Hooks.on("chatMessage", (log, message, data) => {
    if (message === "/inventory") {
      const tokens = canvas.tokens.controlled;
      if (tokens.length === 0) {
        ui.notifications.warn("Select a token first");
        return false;
      }

      tokens.forEach(token => {
        InventoryDisplayManager.createDisplay(token);
      });

      ui.notifications.info("Inventory display created");
      return false;
    }
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  InventoryItem,
  InventoryDisplay,
  InventoryDisplayManager
});


