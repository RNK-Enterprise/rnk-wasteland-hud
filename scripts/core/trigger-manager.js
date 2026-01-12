/**
 * RNK™ Wasteland HUD - Trigger Manager
 * Conditional event firing and explicit entry points
 * @module core/trigger-manager
 */

export class TriggerManager {
  static activeFeatures = new Set();
  static hookHandlers = new Map();

  static enableFeature(featureName) {
    if (!this.activeFeatures.has(featureName)) {
      this.activeFeatures.add(featureName);
      console.log(`[RNK™ Wasteland HUD] Feature enabled: ${featureName}`);
    }
  }

  static disableFeature(featureName) {
    if (this.activeFeatures.has(featureName)) {
      this.activeFeatures.delete(featureName);
      this.removeFeatureHooks(featureName);
      console.log(`[RNK™ Wasteland HUD] Feature disabled: ${featureName}`);
    }
  }

  static isFeatureActive(featureName) {
    return this.activeFeatures.has(featureName);
  }

  static registerHook(featureName, hookName, callback) {
    if (!this.hookHandlers.has(featureName)) {
      this.hookHandlers.set(featureName, []);
    }

    const hookId = Hooks.on(hookName, (...args) => {
      if (this.isFeatureActive(featureName)) {
        callback(...args);
      }
    });

    this.hookHandlers.get(featureName).push({ hookName, hookId });
  }

  static removeFeatureHooks(featureName) {
    const hooks = this.hookHandlers.get(featureName);
    if (hooks) {
      hooks.forEach(({ hookName, hookId }) => {
        Hooks.off(hookName, hookId);
      });
      this.hookHandlers.delete(featureName);
    }
  }

  static setupConditionalHooks() {
    this.registerHook('particles', 'createToken', async (tokenDoc) => {
      const { LazyLoader } = await import('./lazy-loader.js');
      const module = await LazyLoader.loadParticleSystem();
      if (module?.ParticleSystem) {
        module.ParticleSystem.onTokenCreate(tokenDoc);
      }
    });

    this.registerHook('speechBubbles', 'createChatMessage', async (message) => {
      const { LazyLoader } = await import('./lazy-loader.js');
      const module = await LazyLoader.loadSpeechBubbles();
      if (module?.SpeechBubbleManager) {
        module.SpeechBubbleManager.onChatMessage(message);
      }
    });

    this.registerHook('partyFrames', 'updateActor', async (actor, changes) => {
      const { LazyLoader } = await import('./lazy-loader.js');
      const module = await LazyLoader.loadPartyFrames();
      if (module?.PartyFrameManager) {
        module.PartyFrameManager.updateFrame(actor);
      }
    });

    this.registerHook('cinematic', 'renderCameraViews', async () => {
      const { LazyLoader } = await import('./lazy-loader.js');
      const module = await LazyLoader.loadCinematic();
      if (module?.CinematicMode) {
        module.CinematicMode.render();
      }
    });
  }

  static loadFeaturesFromSettings() {
    const settings = {
      particles: game.settings.get('rnk-wasteland-hud', 'enableParticles'),
      speechBubbles: game.settings.get('rnk-wasteland-hud', 'enableSpeechBubbles'),
      partyFrames: game.settings.get('rnk-wasteland-hud', 'enablePartyFrames'),
      cinematic: game.settings.get('rnk-wasteland-hud', 'enableCinematic'),
      tutorial: game.settings.get('rnk-wasteland-hud', 'enableTutorial')
    };

    Object.entries(settings).forEach(([feature, enabled]) => {
      if (enabled) {
        this.enableFeature(feature);
      }
    });
  }

  static initialize() {
    console.log('[RNK™ Wasteland HUD] Trigger Manager initialized');
    this.setupConditionalHooks();
    this.loadFeaturesFromSettings();
  }

  static reset() {
    this.activeFeatures.clear();
    this.hookHandlers.forEach((hooks, featureName) => {
      this.removeFeatureHooks(featureName);
    });
    this.hookHandlers.clear();
  }
}

window.RNKDisplays = window.RNKDisplays || {};
window.RNKDisplays.TriggerManager = TriggerManager;
