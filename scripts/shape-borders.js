/**
 * Shape & Border Options
 * Advanced shapes (hexagon, diamond, circle) with animated borders
 * @module shape-borders
 */

/**
 * Shape creation utilities
 */
export class ShapeCreator {
  /**
   * Create a shaped background
   * @param {string} shape - Shape type (rectangle, rounded-rectangle, hexagon, diamond, circle, star, custom)
   * @param {number} width - Width of shape
   * @param {number} height - Height of shape
   * @param {object} options - Additional options
   * @returns {PIXI.Graphics}
   */
  static createShape(shape, width, height, options = {}) {
    const graphics = new PIXI.Graphics();
    const {
      fillColor = 0x000000,
      fillAlpha = 0.8,
      borderColor = 0xffffff,
      borderWidth = 2,
      borderAlpha = 1,
      cornerRadius = 0,
      points = 5, // For star shape
      customPath = null // For custom SVG path
    } = options;

    // Apply line style
    if (borderWidth > 0) {
      graphics.lineStyle(borderWidth, borderColor, borderAlpha);
    }

    // Apply fill style
    graphics.beginFill(fillColor, fillAlpha);

    switch (shape) {
      case "rectangle":
        graphics.drawRect(0, 0, width, height);
        break;

      case "rounded-rectangle":
        graphics.drawRoundedRect(0, 0, width, height, cornerRadius);
        break;

      case "circle":
        const radius = Math.min(width, height) / 2;
        graphics.drawCircle(width / 2, height / 2, radius);
        break;

      case "ellipse":
        graphics.drawEllipse(width / 2, height / 2, width / 2, height / 2);
        break;

      case "hexagon":
        this._drawHexagon(graphics, width, height);
        break;

      case "diamond":
        this._drawDiamond(graphics, width, height);
        break;

      case "star":
        this._drawStar(graphics, width, height, points);
        break;

      case "octagon":
        this._drawOctagon(graphics, width, height);
        break;

      case "pentagon":
        this._drawPolygon(graphics, width, height, 5);
        break;

      case "custom":
        if (customPath) {
          this._drawCustomPath(graphics, customPath, width, height);
        } else {
          // Fallback to rectangle
          graphics.drawRect(0, 0, width, height);
        }
        break;

      default:
        graphics.drawRect(0, 0, width, height);
    }

    graphics.endFill();
    return graphics;
  }

  /**
   * Draw hexagon
   */
  static _drawHexagon(graphics, width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2;
    const angle = (Math.PI * 2) / 6;

    const points = [];
    for (let i = 0; i < 6; i++) {
      const x = cx + radius * Math.cos(angle * i - Math.PI / 2);
      const y = cy + radius * Math.sin(angle * i - Math.PI / 2);
      points.push(x, y);
    }

    graphics.drawPolygon(points);
  }

  /**
   * Draw diamond
   */
  static _drawDiamond(graphics, width, height) {
    const points = [
      width / 2, 0,           // Top
      width, height / 2,      // Right
      width / 2, height,      // Bottom
      0, height / 2           // Left
    ];
    graphics.drawPolygon(points);
  }

  /**
   * Draw star
   */
  static _drawStar(graphics, width, height, points) {
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.5;
    const angle = Math.PI / points;

    const coords = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + radius * Math.cos(i * angle - Math.PI / 2);
      const y = cy + radius * Math.sin(i * angle - Math.PI / 2);
      coords.push(x, y);
    }

    graphics.drawPolygon(coords);
  }

  /**
   * Draw octagon
   */
  static _drawOctagon(graphics, width, height) {
    this._drawPolygon(graphics, width, height, 8);
  }

  /**
   * Draw regular polygon
   */
  static _drawPolygon(graphics, width, height, sides) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2;
    const angle = (Math.PI * 2) / sides;

    const points = [];
    for (let i = 0; i < sides; i++) {
      const x = cx + radius * Math.cos(angle * i - Math.PI / 2);
      const y = cy + radius * Math.sin(angle * i - Math.PI / 2);
      points.push(x, y);
    }

    graphics.drawPolygon(points);
  }

  /**
   * Draw custom SVG path
   */
  static _drawCustomPath(graphics, path, width, height) {
    // Simple SVG path parser for basic paths
    // This is a simplified version - real implementation would need full SVG path parsing
    console.warn("Custom SVG paths not fully implemented yet");
    graphics.drawRect(0, 0, width, height);
  }
}

/**
 * Animated border effects
 */
export class AnimatedBorder extends PIXI.Container {
  constructor(shape, width, height, options = {}) {
    super();

    this.shape = shape;
    this.width = width;
    this.height = height;
    this.options = {
      animation: "none", // none, rotating, pulsing, color-cycle, gradient-sweep, dash-march
      speed: 1,
      colors: [0xff0000, 0x00ff00, 0x0000ff],
      borderWidth: 2,
      ...options
    };

    this.time = 0;
    this.borderGraphics = null;
    this.glowFilter = null;

    this._createBorder();
    this._setupAnimation();
  }

  _createBorder() {
    this.borderGraphics = ShapeCreator.createShape(this.shape, this.width, this.height, {
      fillColor: 0x000000,
      fillAlpha: 0,
      borderColor: this.options.colors[0],
      borderWidth: this.options.borderWidth,
      borderAlpha: 1,
      cornerRadius: this.options.cornerRadius || 0
    });

    this.addChild(this.borderGraphics);

    // Add glow filter for certain animations (with v12+ fallback)
    if (["pulsing", "color-cycle"].includes(this.options.animation)) {
      try {
        if (typeof PIXI.filters?.GlowFilter !== 'undefined') {
          this.glowFilter = new PIXI.filters.GlowFilter({
            distance: 10,
            outerStrength: 2,
            color: this.options.colors[0]
          });
          this.borderGraphics.filters = [this.glowFilter];
        } else {
          // Fallback: use blur filter for glow effect
          const blur = new PIXI.BlurFilter(3);
          blur.quality = 2;
          this.borderGraphics.filters = [blur];
          this.glowFilter = blur; // Store reference for animation updates
        }
      } catch (err) {
        console.debug('RNK™ Wasteland HUD | GlowFilter not available, using fallback');
      }
    }
  }

  _setupAnimation() {
    if (this.options.animation === "none") return;

    // Add to ticker
    this._tickerFn = (delta) => this._animate(delta);
    canvas.app.ticker.add(this._tickerFn);
  }

  _animate(delta) {
    this.time += delta * 0.016 * this.options.speed; // Convert to seconds

    switch (this.options.animation) {
      case "rotating":
        this.borderGraphics.rotation = this.time;
        break;

      case "pulsing":
        const pulse = Math.sin(this.time * 2) * 0.5 + 0.5;
        this.borderGraphics.alpha = 0.5 + pulse * 0.5;
        if (this.glowFilter) {
          this.glowFilter.outerStrength = 1 + pulse * 2;
        }
        break;

      case "color-cycle":
        const colorIndex = Math.floor(this.time) % this.options.colors.length;
        const nextColorIndex = (colorIndex + 1) % this.options.colors.length;
        const t = this.time % 1;
        
        const color = this._lerpColor(
          this.options.colors[colorIndex],
          this.options.colors[nextColorIndex],
          t
        );
        
        this._updateBorderColor(color);
        if (this.glowFilter) {
          this.glowFilter.color = color;
        }
        break;

      case "gradient-sweep":
        // Rotate gradient angle
        this.borderGraphics.rotation = this.time * 0.5;
        break;

      case "dash-march":
        // Animate dash offset (would need custom shader for true dashed lines)
        this.borderGraphics.pivot.x = (this.time * 10) % 20;
        break;
    }
  }

  _updateBorderColor(color) {
    // Recreate graphics with new color
    this.removeChild(this.borderGraphics);
    this.borderGraphics.destroy();

    this.borderGraphics = ShapeCreator.createShape(this.shape, this.width, this.height, {
      fillColor: 0x000000,
      fillAlpha: 0,
      borderColor: color,
      borderWidth: this.options.borderWidth,
      borderAlpha: 1,
      cornerRadius: this.options.cornerRadius || 0
    });

    this.addChild(this.borderGraphics);
  }

  _lerpColor(color1, color2, t) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  destroy(options) {
    if (this._tickerFn) {
      canvas.app.ticker.remove(this._tickerFn);
    }
    super.destroy(options);
  }
}

/**
 * Shape Border Manager
 */
export class ShapeBorderManager {
  static borders = new Map();

  /**
   * Create or update animated border for token
   */
  static createBorder(token, config) {
    const key = token.id;
    
    // Remove existing border
    this.removeBorder(token);

    if (!config || !config.shape || config.shape === "rectangle") {
      return null;
    }

    const Display = token.Display;
    if (!Display) return null;

    const border = new AnimatedBorder(
      config.shape,
      config.width || 200,
      config.height || 100,
      {
        animation: config.borderAnimation || "none",
        speed: config.animationSpeed || 1,
        colors: config.borderColors || [0xffffff],
        borderWidth: config.borderWidth || 2,
        cornerRadius: config.cornerRadius || 0
      }
    );

    // Position behind text
    Display.addChildAt(border, 0);
    this.borders.set(key, border);

    return border;
  }

  /**
   * Remove border from token
   */
  static removeBorder(token) {
    const key = token.id;
    const border = this.borders.get(key);
    
    if (border) {
      border.destroy();
      this.borders.delete(key);
    }
  }

  /**
   * Update border for token
   */
  static updateBorder(token, config) {
    return this.createBorder(token, config);
  }

  /**
   * Get border for token
   */
  static getBorder(token) {
    return this.borders.get(token.id);
  }

  /**
   * Clear all borders
   */
  static clear() {
    this.borders.forEach(border => border.destroy());
    this.borders.clear();
  }
}

/**
 * Setup function
 */
export function setupShapeBorders() {
  console.log("RNK™ Wasteland HUD | Shape & Border system initialized");

  // Clear borders on canvas tear down
  Hooks.on("canvasTearDown", () => {
    ShapeBorderManager.clear();
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  ShapeCreator,
  AnimatedBorder,
  ShapeBorderManager
});


