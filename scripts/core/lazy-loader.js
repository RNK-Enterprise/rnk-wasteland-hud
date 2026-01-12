/**
 * RNK™ Wasteland HUD - Lazy Loader
 * Dynamic module loading for non-critical features
 * @module core/lazy-loader
 */

export class LazyLoader {
  static loadedModules = new Map();
  static loadingPromises = new Map();

  static async load(modulePath, moduleName = null) {
    const name = moduleName || modulePath;
    
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }

    if (this.loadingPromises.has(name)) {
      return await this.loadingPromises.get(name);
    }

    const loadPromise = this._loadModule(modulePath, name);
    this.loadingPromises.set(name, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(name, module);
      this.loadingPromises.delete(name);
      console.log(`[RNK™ Wasteland HUD] Lazy loaded: ${name}`);
      return module;
    } catch (err) {
      this.loadingPromises.delete(name);
      console.error(`[RNK™ Wasteland HUD] Failed to lazy load ${name}:`, err);
      throw err;
    }
  }

  static async _loadModule(modulePath, name) {
    const basePath = 'modules/rnk-wasteland-hud/scripts/';
    const fullPath = modulePath.startsWith(basePath) ? modulePath : basePath + modulePath;
    return await import(fullPath);
  }

  static async loadParticleSystem() {
    return await this.load('particle-system.js', 'ParticleSystem');
  }

  static async loadSpeechBubbles() {
    return await this.load('speech-bubbles.js', 'SpeechBubbles');
  }

  static async loadPartyFrames() {
    return await this.load('party-frames.js', 'PartyFrames');
  }

  static async loadCinematic() {
    return await this.load('cinematic.js', 'Cinematic');
  }

  static async loadTutorial() {
    return await this.load('tutorial.js', 'Tutorial');
  }

  static async loadPresetBuilder() {
    return await this.load('preset-builder.js', 'PresetBuilder');
  }

  static async loadInventoryDisplay() {
    return await this.load('inventory-display.js', 'InventoryDisplay');
  }

  static async loadBackgroundTextures() {
    return await this.load('background-textures.js', 'BackgroundTextures');
  }

  static isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  static unload(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      this.loadedModules.delete(moduleName);
      console.log(`[RNK™ Wasteland HUD] Unloaded: ${moduleName}`);
    }
  }

  static clearAll() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    console.log('[RNK™ Wasteland HUD] All lazy-loaded modules cleared');
  }
}

window.RNKDisplays = window.RNKDisplays || {};
window.RNKDisplays.LazyLoader = LazyLoader;
