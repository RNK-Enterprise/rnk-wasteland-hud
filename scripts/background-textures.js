/**
 * Background Textures
 * Stone, metal, wood, and custom texture support for token Displays
 * @module background-textures
 */

/**
 * Texture Library
 */
export class TextureLibrary {
  static textures = new Map();
  static loaded = false;

  /**
   * Built-in procedural textures
   */
  static PROCEDURAL_TEXTURES = {
    stone: {
      name: "Stone",
      generate: (width, height) => this._generateStoneTexture(width, height)
    },
    metal: {
      name: "Metal",
      generate: (width, height) => this._generateMetalTexture(width, height)
    },
    wood: {
      name: "Wood",
      generate: (width, height) => this._generateWoodTexture(width, height)
    },
    parchment: {
      name: "Parchment",
      generate: (width, height) => this._generateParchmentTexture(width, height)
    },
    fabric: {
      name: "Fabric",
      generate: (width, height) => this._generateFabricTexture(width, height)
    },
    leather: {
      name: "Leather",
      generate: (width, height) => this._generateLeatherTexture(width, height)
    },
    marble: {
      name: "Marble",
      generate: (width, height) => this._generateMarbleTexture(width, height)
    },
    rust: {
      name: "Rust",
      generate: (width, height) => this._generateRustTexture(width, height)
    }
  };

  /**
   * Initialize texture library
   */
  static async initialize() {
    if (this.loaded) return;

    // Generate procedural textures
    for (const [key, data] of Object.entries(this.PROCEDURAL_TEXTURES)) {
      const canvas = data.generate(256, 256);
      const texture = PIXI.Texture.from(canvas);
      this.textures.set(key, texture);
    }

    this.loaded = true;
    console.log("RNK Wasteland HUD | Texture library initialized");
  }

  /**
   * Get texture by name
   */
  static getTexture(name) {
    return this.textures.get(name);
  }

  /**
   * Load custom texture from URL
   */
  static async loadCustomTexture(name, url) {
    try {
      const texture = await PIXI.Texture.fromURL(url);
      this.textures.set(name, texture);
      return texture;
    } catch (error) {
      console.error(`Failed to load texture: ${url}`, error);
      return null;
    }
  }

  /**
   * Generate stone texture
   */
  static _generateStoneTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base color
    ctx.fillStyle = "#666666";
    ctx.fillRect(0, 0, width, height);

    // Add noise
    for (let i = 0; i < width * height * 0.1; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const brightness = Math.random() * 60 - 30;
      const gray = 102 + brightness;
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Add cracks
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    return canvas;
  }

  /**
   * Generate metal texture
   */
  static _generateMetalTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#888888");
    gradient.addColorStop(0.5, "#cccccc");
    gradient.addColorStop(1, "#888888");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add brushed metal lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 3) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    return canvas;
  }

  /**
   * Generate wood texture
   */
  static _generateWoodTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base wood color
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 0, width, height);

    // Wood grain lines
    ctx.strokeStyle = "rgba(101, 67, 33, 0.5)";
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      const y = (i / 20) * height;
      const variance = Math.sin(i) * 10;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      for (let x = 0; x < width; x += 10) {
        const offset = Math.sin(x * 0.05) * 5 + variance;
        ctx.lineTo(x, y + offset);
      }
      
      ctx.stroke();
    }

    return canvas;
  }

  /**
   * Generate parchment texture
   */
  static _generateParchmentTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base parchment color
    ctx.fillStyle = "#F4E8C1";
    ctx.fillRect(0, 0, width, height);

    // Add age spots
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 5 + 2;
      
      ctx.fillStyle = `rgba(139, 69, 19, ${Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add subtle texture
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 10 - 5;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
    
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  /**
   * Generate fabric texture
   */
  static _generateFabricTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base fabric color
    ctx.fillStyle = "#4A4A4A";
    ctx.fillRect(0, 0, width, height);

    // Weave pattern
    ctx.fillStyle = "rgba(80, 80, 80, 0.5)";
    
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    return canvas;
  }

  /**
   * Generate leather texture
   */
  static _generateLeatherTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base leather color
    ctx.fillStyle = "#654321";
    ctx.fillRect(0, 0, width, height);

    // Add wrinkles and creases
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = Math.random() * 20 + 10;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = `rgba(80, 50, 30, ${Math.random() * 0.3})`;
      ctx.lineWidth = Math.random() * 2 + 1;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    return canvas;
  }

  /**
   * Generate marble texture
   */
  static _generateMarbleTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base marble color
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // Add veins
    ctx.strokeStyle = "rgba(180, 180, 180, 0.4)";
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      
      for (let j = 0; j < 5; j++) {
        ctx.bezierCurveTo(
          Math.random() * width, Math.random() * height,
          Math.random() * width, Math.random() * height,
          Math.random() * width, Math.random() * height
        );
      }
      
      ctx.stroke();
    }

    return canvas;
  }

  /**
   * Generate rust texture
   */
  static _generateRustTexture(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base rust color
    ctx.fillStyle = "#B7410E";
    ctx.fillRect(0, 0, width, height);

    // Add rust patches
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 8 + 2;
      const colors = ["#A0522D", "#CD853F", "#8B4513", "#D2691E"];
      
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }
}

/**
 * Textured Background
 */
export class TexturedBackground extends PIXI.Container {
  constructor(textureName, width, height, options = {}) {
    super();

    this.textureName = textureName;
    this.width = width;
    this.height = height;
    this.options = {
      tint: 0xffffff,
      alpha: 1,
      scale: 1,
      rotation: 0,
      blendMode: PIXI.BLEND_MODES.NORMAL,
      ...options
    };

    this.sprite = null;
    this._createSprite();
  }

  async _createSprite() {
    await TextureLibrary.initialize();

    const texture = TextureLibrary.getTexture(this.textureName);
    if (!texture) {
      console.warn(`Texture not found: ${this.textureName}`);
      return;
    }

    this.sprite = new PIXI.TilingSprite(texture, this.width, this.height);
    this.sprite.tint = this.options.tint;
    this.sprite.alpha = this.options.alpha;
    this.sprite.rotation = this.options.rotation;
    this.sprite.blendMode = this.options.blendMode;
    
    // Apply scale to tiling
    this.sprite.tileScale.set(this.options.scale);

    this.addChild(this.sprite);
  }

  updateTexture(textureName) {
    this.textureName = textureName;
    
    if (this.sprite) {
      this.removeChild(this.sprite);
      this.sprite.destroy();
    }
    
    this._createSprite();
  }

  setTint(color) {
    this.options.tint = color;
    if (this.sprite) {
      this.sprite.tint = color;
    }
  }

  setAlpha(alpha) {
    this.options.alpha = alpha;
    if (this.sprite) {
      this.sprite.alpha = alpha;
    }
  }
}

/**
 * Texture Manager
 */
export class TextureManager {
  static backgrounds = new Map();

  /**
   * Create textured background for token Display
   */
  static async createBackground(token, config) {
    const key = token.id;
    
    // Remove existing background
    this.removeBackground(token);

    if (!config || !config.texture || config.texture === "none") {
      return null;
    }

    const Display = token.Display;
    if (!Display) return null;

    const background = new TexturedBackground(
      config.texture,
      config.width || 200,
      config.height || 100,
      {
        tint: config.textureTint || 0xffffff,
        alpha: config.textureAlpha || 0.8,
        scale: config.textureScale || 1,
        rotation: config.textureRotation || 0,
        blendMode: config.textureBlend || PIXI.BLEND_MODES.NORMAL
      }
    );

    // Position behind all other elements
    Display.addChildAt(background, 0);
    this.backgrounds.set(key, background);

    return background;
  }

  /**
   * Remove background from token
   */
  static removeBackground(token) {
    const key = token.id;
    const background = this.backgrounds.get(key);
    
    if (background) {
      background.destroy({ children: true });
      this.backgrounds.delete(key);
    }
  }

  /**
   * Update background for token
   */
  static updateBackground(token, config) {
    return this.createBackground(token, config);
  }

  /**
   * Get background for token
   */
  static getBackground(token) {
    return this.backgrounds.get(token.id);
  }

  /**
   * Clear all backgrounds
   */
  static clear() {
    this.backgrounds.forEach(bg => bg.destroy({ children: true }));
    this.backgrounds.clear();
  }

  /**
   * Get list of available textures
   */
  static getAvailableTextures() {
    return Object.keys(TextureLibrary.PROCEDURAL_TEXTURES);
  }
}

/**
 * Setup function
 */
export async function setupBackgroundTextures() {
  await TextureLibrary.initialize();
  console.log("RNK Wasteland HUD | Background textures initialized");

  // Clear backgrounds on canvas tear down
  Hooks.on("canvasTearDown", () => {
    TextureManager.clear();
  });
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  TextureLibrary,
  TexturedBackground,
  TextureManager
});


