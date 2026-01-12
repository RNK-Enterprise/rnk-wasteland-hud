/**
 * Party Frames System
 * MMO-style raid frames showing all party members
 * @module party-frames
 */

/**
 * Party Member Frame
 */
export class PartyMemberFrame extends PIXI.Container {
  constructor(actor, config = {}) {
    super();

    this.actor = actor;
    this.config = {
      width: 200,
      height: 50,
      showPortrait: true,
      showConditions: true,
      showResources: true,
      compact: false,
      ...config
    };

    this.portrait = null;
    this.nameText = null;
    this.hpBar = null;
    this.resourceBars = [];
    this.conditionIcons = [];

    this._createFrame();
  }

  async _createFrame() {
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRoundedRect(0, 0, this.config.width, this.config.height, 5);
    bg.endFill();
    bg.lineStyle(2, 0x444444, 1);
    bg.drawRoundedRect(0, 0, this.config.width, this.config.height, 5);
    this.addChild(bg);

    let xOffset = 5;

    // Portrait
    if (this.config.showPortrait) {
      await this._createPortrait();
      if (this.portrait) {
        this.portrait.position.set(xOffset, 5);
        this.addChild(this.portrait);
        xOffset += 42;
      }
    }

    // Name
    this.nameText = new PIXI.Text(this.actor.name, {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: "bold"
    });
    this.nameText.position.set(xOffset, 5);
    this.addChild(this.nameText);

    // HP Bar
    this._createHPBar(xOffset, 22);

    // Resource bars (if not compact)
    if (!this.config.compact && this.config.showResources) {
      this._createResourceBars(xOffset, 35);
    }

    // Conditions
    if (this.config.showConditions) {
      this._createConditions();
    }

    // Make interactive
    this.interactive = true;
    this.cursor = "pointer";
    this._setupInteraction();
  }

  async _createPortrait() {
    try {
      const img = this.actor.img || this.actor.prototypeToken?.texture?.src;
      // Use Foundry's loadTexture for v12+ compatibility
      const texture = await loadTexture(img);
      
      this.portrait = new PIXI.Sprite(texture);
      this.portrait.width = 40;
      this.portrait.height = 40;

      // Add border
      const border = new PIXI.Graphics();
      border.lineStyle(2, 0xffffff, 1);
      border.drawRect(-1, -1, 42, 42);
      this.portrait.addChild(border);
    } catch (error) {
      console.warn("Failed to load portrait:", this.actor.img);
    }
  }

  _createHPBar(x, y) {
    const hp = this.actor.system.attributes.hp;
    const percentage = hp.value / hp.max;
    const barWidth = this.config.width - x - 10;

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.5);
    bg.drawRect(x, y, barWidth, 10);
    bg.endFill();
    this.addChild(bg);

    // HP Bar
    this.hpBar = new PIXI.Graphics();
    this._updateHPBar();
    this.hpBar.position.set(x, y);
    this.addChild(this.hpBar);

    // HP Text
    const hpText = new PIXI.Text(`${hp.value}/${hp.max}`, {
      fontFamily: "Arial",
      fontSize: 9,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2
    });
    hpText.position.set(x + barWidth / 2 - hpText.width / 2, y);
    this.addChild(hpText);
    this.hpText = hpText;
  }

  _updateHPBar() {
    if (!this.hpBar) return;

    const hp = this.actor.system.attributes.hp;
    const percentage = Math.max(0, hp.value / hp.max);
    const barWidth = this.config.width - 55 - 10;

    // Color based on percentage
    let color = 0x00ff00;
    if (percentage < 0.25) color = 0xff0000;
    else if (percentage < 0.5) color = 0xff9900;
    else if (percentage < 0.75) color = 0xffff00;

    this.hpBar.clear();
    this.hpBar.beginFill(color, 0.8);
    this.hpBar.drawRect(0, 0, barWidth * percentage, 10);
    this.hpBar.endFill();

    if (this.hpText) {
      this.hpText.text = `${hp.value}/${hp.max}`;
    }
  }

  _createResourceBars(x, y) {
    // System-specific resources (spell slots, ki points, etc.)
    const system = game.system.id;

    if (system === "dnd5e") {
      // Spell slots or other resources
      const spells = this.actor.system.spells;
      if (spells?.spell1) {
        const percentage = spells.spell1.value / spells.spell1.max;
        const barWidth = this.config.width - x - 10;

        const resourceBar = new PIXI.Graphics();
        resourceBar.beginFill(0x6666ff, 0.8);
        resourceBar.drawRect(x, y, barWidth * percentage, 5);
        resourceBar.endFill();
        this.addChild(resourceBar);
        this.resourceBars.push(resourceBar);
      }
    }
  }

  _createConditions() {
    const effects = this.actor.effects;
    let xOffset = this.config.width - 25;

    for (const effect of effects) {
      if (this.conditionIcons.length >= 3) break; // Max 3 icons

      this._createConditionIcon(effect, xOffset, 5);
      xOffset -= 20;
    }
  }

  async _createConditionIcon(effect, x, y) {
    try {
      const texture = await PIXI.Texture.fromURL(effect.icon);
      const icon = new PIXI.Sprite(texture);
      icon.width = 16;
      icon.height = 16;
      icon.position.set(x, y);
      this.addChild(icon);
      this.conditionIcons.push(icon);
    } catch (error) {
      console.warn("Failed to load condition icon:", effect.icon);
    }
  }

  _setupInteraction() {
    this.on("pointerover", () => {
      this.alpha = 0.8;
    });

    this.on("pointerout", () => {
      this.alpha = 1;
    });

    this.on("pointerdown", () => {
      // Select token
      const token = this.actor.getActiveTokens()[0];
      if (token) {
        token.control();
        canvas.animatePan({ x: token.x, y: token.y, duration: 250 });
      }
    });

    this.on("rightdown", () => {
      // Open character sheet
      if (this.actor?.sheet?.render) {
        this.actor.sheet.render(true);
      }
    });
  }

  update() {
    this._updateHPBar();
    // Could update resources and conditions here too
  }
}

/**
 * Party Frames Application
 */
export class PartyFramesApp extends Application {
  constructor(options = {}) {
    super(options);
    
    this.frames = [];
    this.config = {
      showPortraits: true,
      showConditions: true,
      showResources: true,
      compact: false,
      sortBy: "name", // name, hp, class
      ...options
    };
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "party-frames",
      template: "modules/rnk-wasteland-hud/templates/party-frames.html",
      title: "Party Frames",
      width: 220,
      height: "auto",
      resizable: true,
      classes: ["party-frames"],
      popOut: true
    });
  }

  getData() {
    const party = game.actors.filter(a => a.hasPlayerOwner && a.type === "character");
    
    // Sort party members
    party.sort((a, b) => {
      switch (this.config.sortBy) {
        case "hp":
          const hpA = a.system.attributes.hp.value / a.system.attributes.hp.max;
          const hpB = b.system.attributes.hp.value / b.system.attributes.hp.max;
          return hpA - hpB;
        case "class":
          return (a.system.details.class || "").localeCompare(b.system.details.class || "");
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return {
      party: party.map(actor => ({
        id: actor.id,
        name: actor.name,
        img: actor.img,
        hp: actor.system.attributes.hp,
        ac: actor.system.attributes.ac?.value,
        class: actor.system.details.class,
        level: actor.system.details.level
      })),
      config: this.config
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Click to select token
    html.find(".party-member").click((event) => {
      const actorId = $(event.currentTarget).data("actor-id");
      const actor = game.actors.get(actorId);
      const token = actor?.getActiveTokens()[0];
      
      if (token) {
        token.control();
        canvas.animatePan({ x: token.x, y: token.y, duration: 250 });
      }
    });

    // Right-click to open sheet
    html.find(".party-member").contextmenu((event) => {
      event.preventDefault();
      const actorId = $(event.currentTarget).data("actor-id");
      const actor = game.actors.get(actorId);
      actor?.sheet.render(true);
    });

    // Sort buttons
    html.find("[data-sort]").click((event) => {
      this.config.sortBy = $(event.currentTarget).data("sort");
      this.render();
    });

    // Toggle options
    html.find(".toggle-portraits").change((event) => {
      this.config.showPortraits = event.target.checked;
      this.render();
    });

    html.find(".toggle-conditions").change((event) => {
      this.config.showConditions = event.target.checked;
      this.render();
    });

    html.find(".toggle-compact").change((event) => {
      this.config.compact = event.target.checked;
      this.render();
    });
  }
}

/**
 * Party Frames Manager
 */
export class PartyFramesManager {
  static app = null;

  /**
   * Show party frames
   */
  static show() {
    if (!this.app) {
      this.app = new PartyFramesApp();
    }
    this.app.render(true);
  }

  /**
   * Hide party frames
   */
  static hide() {
    if (this.app) {
      this.app.close();
    }
  }

  /**
   * Toggle party frames
   */
  static toggle() {
    if (this.app?.rendered) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update party frames
   */
  static update() {
    if (this.app?.rendered) {
      this.app.render();
    }
  }
}

/**
 * Setup function
 */
export function setupPartyFrames() {
  console.log("RNK™ Wasteland HUD | Party frames initialized");

  // Register settings
  game.settings.register("rnk-wasteland-hud", "showPartyFrames", {
    name: "Show Party Frames",
    hint: "Display party frames window automatically",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      if (value) {
        PartyFramesManager.show();
      } else {
        PartyFramesManager.hide();
      }
    }
  });

  // Show on ready if enabled
  Hooks.on("ready", () => {
    if (game.settings.get("rnk-wasteland-hud", "showPartyFrames")) {
      PartyFramesManager.show();
    }
  });

  // Update on actor changes
  Hooks.on("updateActor", (actor, changes, options, userId) => {
    if (actor.hasPlayerOwner) {
      PartyFramesManager.update();
    }
  });

  // Add UI button
  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find(c => c.name === "token");
    
    tokenControls.tools.push({
      name: "party-frames",
      title: "Toggle Party Frames",
      icon: "fas fa-users",
      onClick: () => PartyFramesManager.toggle(),
      button: true
    });
  });

  // Chat command
  Hooks.on("chatMessage", (log, message, data) => {
    if (message === "/party") {
      PartyFramesManager.toggle();
      return false;
    }
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  PartyMemberFrame,
  PartyFramesApp,
  PartyFramesManager
});


