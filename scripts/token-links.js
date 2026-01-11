/**
 * Token Linking & Relationships
 * Visual lines between tokens showing ally/enemy relationships, distance, and connections
 * @module token-links
 */

/**
 * Token Link
 */
export class TokenLink extends PIXI.Graphics {
  constructor(sourceToken, targetToken, config = {}) {
    super();

    this.sourceToken = sourceToken;
    this.targetToken = targetToken;
    this.config = {
      type: "ally", // ally, enemy, concentration, grapple, custom
      color: 0x00ff00,
      width: 2,
      alpha: 0.7,
      dashed: false,
      animated: false,
      showDistance: true,
      showLabel: false,
      label: "",
      bidirectional: false,
      ...config
    };

    this.distanceText = null;
    this.labelText = null;
    this.animationTime = 0;

    this._applyTypeDefaults();
    this._createLink();
    this._createLabels();
  }

  _applyTypeDefaults() {
    const typeDefaults = {
      ally: { color: 0x00ff00, dashed: false, animated: false },
      enemy: { color: 0xff0000, dashed: true, animated: false },
      concentration: { color: 0x9966ff, dashed: false, animated: true },
      grapple: { color: 0xffa500, dashed: false, animated: true },
      custom: {}
    };

    const defaults = typeDefaults[this.config.type] || typeDefaults.custom;
    this.config = { ...defaults, ...this.config };
  }

  _createLink() {
    this._drawLine();
  }

  _createLabels() {
    if (this.config.showDistance) {
      this.distanceText = new PIXI.Text("", {
        fontFamily: "Arial",
        fontSize: 12,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2
      });
      this.addChild(this.distanceText);
    }

    if (this.config.showLabel && this.config.label) {
      this.labelText = new PIXI.Text(this.config.label, {
        fontFamily: "Arial",
        fontSize: 10,
        fill: this.config.color,
        stroke: 0x000000,
        strokeThickness: 2
      });
      this.addChild(this.labelText);
    }
  }

  _drawLine() {
    this.clear();

    if (!this.sourceToken || !this.targetToken) return;

    const start = this.sourceToken.center;
    const end = this.targetToken.center;

    this.lineStyle(this.config.width, this.config.color, this.config.alpha);

    if (this.config.dashed) {
      this._drawDashedLine(start.x, start.y, end.x, end.y);
    } else {
      this.moveTo(start.x, start.y);
      this.lineTo(end.x, end.y);
    }

    // Draw arrow for directional links
    if (!this.config.bidirectional) {
      this._drawArrowhead(start, end);
    }
  }

  _drawDashedLine(x1, y1, x2, y2, dashLength = 10, gapLength = 5) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.floor(distance / (dashLength + gapLength));

    const xStep = dx / distance * dashLength;
    const yStep = dy / distance * dashLength;
    const xGap = dx / distance * gapLength;
    const yGap = dy / distance * gapLength;

    let x = x1;
    let y = y1;

    for (let i = 0; i < segments; i++) {
      this.moveTo(x, y);
      x += xStep;
      y += yStep;
      this.lineTo(x, y);
      x += xGap;
      y += yGap;
    }
  }

  _drawArrowhead(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const headLength = 15;
    const headAngle = Math.PI / 6;

    this.beginFill(this.config.color, this.config.alpha);
    this.moveTo(end.x, end.y);
    this.lineTo(
      end.x - headLength * Math.cos(angle - headAngle),
      end.y - headLength * Math.sin(angle - headAngle)
    );
    this.lineTo(
      end.x - headLength * Math.cos(angle + headAngle),
      end.y - headLength * Math.sin(angle + headAngle)
    );
    this.lineTo(end.x, end.y);
    this.endFill();
  }

  update(delta = 1) {
    // Redraw line (in case tokens moved)
    this._drawLine();

    // Update distance
    if (this.distanceText && this.sourceToken && this.targetToken) {
      const distance = this._getDistance();
      this.distanceText.text = `${Math.round(distance)} ft`;

      // Position at midpoint
      const start = this.sourceToken.center;
      const end = this.targetToken.center;
      this.distanceText.position.set(
        (start.x + end.x) / 2 - this.distanceText.width / 2,
        (start.y + end.y) / 2 - this.distanceText.height / 2
      );
    }

    // Update label position
    if (this.labelText && this.sourceToken && this.targetToken) {
      const start = this.sourceToken.center;
      const end = this.targetToken.center;
      this.labelText.position.set(
        (start.x + end.x) / 2 - this.labelText.width / 2,
        (start.y + end.y) / 2 + 15
      );
    }

    // Animate if enabled
    if (this.config.animated) {
      this.animationTime += delta * 0.05;
      this.alpha = 0.5 + Math.sin(this.animationTime) * 0.3;
    }
  }

  _getDistance() {
    if (!this.sourceToken || !this.targetToken) return 0;

    const start = this.sourceToken.center;
    const end = this.targetToken.center;
    const gridDistance = canvas.grid.measureDistance(start, end);
    
    return gridDistance;
  }
}

/**
 * Token Link Manager
 */
export class TokenLinkManager {
  static links = new Map();
  static container = null;

  /**
   * Initialize link container
   */
  static initialize() {
    if (!canvas.ready) return;

    // Create container for links (render below tokens)
    this.container = new PIXI.Container();
    canvas.stage.addChildAt(this.container, 0);
  }

  /**
   * Create link between two tokens
   */
  static createLink(sourceToken, targetToken, config = {}) {
    if (!sourceToken || !targetToken) return null;

    const key = `${sourceToken.id}-${targetToken.id}`;
    
    // Remove existing link
    this.removeLink(key);

    const link = new TokenLink(sourceToken, targetToken, config);
    this.container.addChild(link);
    this.links.set(key, link);

    return link;
  }

  /**
   * Remove link
   */
  static removeLink(key) {
    const link = this.links.get(key);
    if (link) {
      this.container.removeChild(link);
      link.destroy({ children: true });
      this.links.delete(key);
    }
  }

  /**
   * Remove all links for a token
   */
  static removeTokenLinks(token) {
    const toRemove = [];
    
    for (const [key, link] of this.links.entries()) {
      if (link.sourceToken.id === token.id || link.targetToken.id === token.id) {
        toRemove.push(key);
      }
    }

    toRemove.forEach(key => this.removeLink(key));
  }

  /**
   * Get link between two tokens
   */
  static getLink(sourceToken, targetToken) {
    const key = `${sourceToken.id}-${targetToken.id}`;
    return this.links.get(key);
  }

  /**
   * Get all links for a token
   */
  static getTokenLinks(token) {
    const tokenLinks = [];
    
    for (const link of this.links.values()) {
      if (link.sourceToken.id === token.id || link.targetToken.id === token.id) {
        tokenLinks.push(link);
      }
    }

    return tokenLinks;
  }

  /**
   * Update all links
   */
  static update(delta = 1) {
    for (const link of this.links.values()) {
      link.update(delta);
    }
  }

  /**
   * Clear all links
   */
  static clear() {
    this.links.forEach(link => link.destroy({ children: true }));
    this.links.clear();
    
    if (this.container) {
      this.container.removeChildren();
    }
  }

  /**
   * Create ally links for party
   */
  static createPartyLinks() {
    const party = game.actors.filter(a => a.hasPlayerOwner);
    const tokens = canvas.tokens.placeables.filter(t => 
      party.some(a => a.id === t.actor?.id)
    );

    // Create links between all party members
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        this.createLink(tokens[i], tokens[j], {
          type: "ally",
          showDistance: false,
          bidirectional: true
        });
      }
    }
  }

  /**
   * Create enemy links (selected vs targets)
   */
  static createEnemyLinks() {
    const selected = canvas.tokens.controlled;
    const targets = Array.from(game.user.targets);

    selected.forEach(source => {
      targets.forEach(target => {
        if (source.id !== target.id) {
          this.createLink(source, target, {
            type: "enemy",
            showDistance: true
          });
        }
      });
    });
  }
}

/**
 * Relationship Tracker
 */
export class RelationshipTracker {
  /**
   * Get relationship between two tokens
   */
  static getRelationship(token1, token2) {
    if (!token1.actor || !token2.actor) return "neutral";

    const disp1 = token1.actor.system.details?.disposition || token1.document.disposition;
    const disp2 = token2.actor.system.details?.disposition || token2.document.disposition;

    // Same disposition = ally
    if (disp1 === disp2) return "ally";

    // Opposite dispositions = enemy
    if (Math.abs(disp1 - disp2) >= 2) return "enemy";

    return "neutral";
  }

  /**
   * Auto-create links based on disposition
   */
  static autoLinkByDisposition() {
    const tokens = canvas.tokens.placeables;

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const relationship = this.getRelationship(tokens[i], tokens[j]);
        
        if (relationship !== "neutral") {
          TokenLinkManager.createLink(tokens[i], tokens[j], {
            type: relationship,
            showDistance: relationship === "enemy",
            bidirectional: true
          });
        }
      }
    }
  }
}

/**
 * Setup function
 */
export function setupTokenLinks() {
  console.log("RNK™ Wasteland HUD | Token linking system initialized");

  // Initialize on canvas ready
  Hooks.on("canvasReady", () => {
    TokenLinkManager.initialize();
  });

  // Update links on token movement
  Hooks.on("updateToken", (document, change, options, userId) => {
    if ("x" in change || "y" in change) {
      const token = canvas.tokens.get(document.id);
      if (token) {
        const links = TokenLinkManager.getTokenLinks(token);
        links.forEach(link => link.update());
      }
    }
  });

  // Remove links when token deleted
  Hooks.on("deleteToken", (document, options, userId) => {
    const token = canvas.tokens.get(document.id);
    if (token) {
      TokenLinkManager.removeTokenLinks(token);
    }
  });

  // Add to ticker for animations
  Hooks.on("canvasReady", () => {
    canvas.app.ticker.add((delta) => {
      TokenLinkManager.update(delta);
    });
  });

  // Clear on tear down
  Hooks.on("canvasTearDown", () => {
    TokenLinkManager.clear();
  });

  // Chat commands
  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/link")) {
      const args = message.split(" ");
      const command = args[1];

      switch (command) {
        case "ally":
        case "enemy":
        case "concentration":
        case "grapple":
          const selected = canvas.tokens.controlled;
          const targets = Array.from(game.user.targets);
          
          if (selected.length === 0 || targets.length === 0) {
            ui.notifications.warn("Select source token(s) and target token(s)");
            return false;
          }

          selected.forEach(source => {
            targets.forEach(target => {
              if (source.id !== target.id) {
                TokenLinkManager.createLink(source, target, { type: command });
              }
            });
          });

          ui.notifications.info(`${command} links created`);
          break;

        case "party":
          TokenLinkManager.createPartyLinks();
          ui.notifications.info("Party links created");
          break;

        case "auto":
          RelationshipTracker.autoLinkByDisposition();
          ui.notifications.info("Auto-links created based on disposition");
          break;

        case "clear":
          if (canvas.tokens.controlled.length > 0) {
            canvas.tokens.controlled.forEach(t => TokenLinkManager.removeTokenLinks(t));
            ui.notifications.info("Links cleared for selected tokens");
          } else {
            TokenLinkManager.clear();
            ui.notifications.info("All links cleared");
          }
          break;

        default:
          ui.notifications.info("Usage: /link [ally|enemy|concentration|grapple|party|auto|clear]");
      }

      return false;
    }
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  TokenLink,
  TokenLinkManager,
  RelationshipTracker
});


