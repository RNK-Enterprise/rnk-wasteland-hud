/**
 * Plugin System
 * Extensible API for third-party plugins
 * @module plugin-system
 */

/**
 * Plugin Base Class
 */
export class DisplayPlugin {
  constructor(id, metadata = {}) {
    this.id = id;
    this.metadata = {
      name: metadata.name || id,
      version: metadata.version || "1.0.0",
      author: metadata.author || "Unknown",
      description: metadata.description || "",
      dependencies: metadata.dependencies || [],
      ...metadata
    };

    this.enabled = true;
    this.hooks = new Map();
    this.commands = new Map();
  }

  /**
   * Initialize the plugin
   */
  async initialize() {
    console.log(`RNK™ Wasteland HUD | Plugin '${this.metadata.name}' initialized`);
  }

  /**
   * Enable the plugin
   */
  enable() {
    this.enabled = true;
    this.onEnable();
  }

  /**
   * Disable the plugin
   */
  disable() {
    this.enabled = false;
    this.onDisable();
  }

  /**
   * Called when plugin is enabled
   */
  onEnable() {}

  /**
   * Called when plugin is disabled
   */
  onDisable() {}

  /**
   * Register a hook
   */
  registerHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(callback);
  }

  /**
   * Register a chat command
   */
  registerCommand(command, callback, description = "") {
    this.commands.set(command, { callback, description });
  }

  /**
   * Trigger a hook
   */
  triggerHook(hookName, ...args) {
    const callbacks = this.hooks.get(hookName) || [];
    for (const callback of callbacks) {
      if (this.enabled) {
        callback.apply(this, args);
      }
    }
  }
}

/**
 * Plugin System Manager
 */
export class PluginSystem {
  static plugins = new Map();
  static hooks = new Map();
  static api = {};

  /**
   * Register a plugin
   */
  static registerPlugin(plugin) {
    if (!(plugin instanceof DisplayPlugin)) {
      console.error("Plugin must extend DisplayPlugin class");
      return false;
    }

    // Check dependencies
    for (const dep of plugin.metadata.dependencies) {
      if (!this.plugins.has(dep)) {
        console.error(`Plugin '${plugin.id}' requires '${dep}' which is not loaded`);
        return false;
      }
    }

    this.plugins.set(plugin.id, plugin);
    plugin.initialize();

    // Register plugin hooks with system
    for (const [hookName, callbacks] of plugin.hooks.entries()) {
      this._registerSystemHook(hookName, plugin);
    }

    // Register plugin commands
    for (const [command, data] of plugin.commands.entries()) {
      this._registerCommand(plugin, command, data);
    }

    console.log(`RNK™ Wasteland HUD | Plugin '${plugin.metadata.name}' registered`);
    return true;
  }

  /**
   * Unregister a plugin
   */
  static unregisterPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.disable();
    this.plugins.delete(pluginId);

    console.log(`RNK™ Wasteland HUD | Plugin '${plugin.metadata.name}' unregistered`);
    return true;
  }

  /**
   * Get a plugin
   */
  static getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  static getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Enable a plugin
   */
  static enablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enable();
      return true;
    }
    return false;
  }

  /**
   * Disable a plugin
   */
  static disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.disable();
      return true;
    }
    return false;
  }

  /**
   * Trigger a hook
   */
  static triggerHook(hookName, ...args) {
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        plugin.triggerHook(hookName, ...args);
      }
    }
  }

  /**
   * Register system hook
   */
  static _registerSystemHook(hookName, plugin) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
      
      // Create Foundry hook
      Hooks.on(hookName, (...args) => {
        this.triggerHook(hookName, ...args);
      });
    }

    this.hooks.get(hookName).push(plugin.id);
  }

  /**
   * Register command
   */
  static _registerCommand(plugin, command, data) {
    Hooks.on("chatMessage", (log, message, messageData) => {
      if (message.startsWith(`/${command}`)) {
        if (plugin.enabled) {
          const args = message.split(" ").slice(1);
          data.callback.call(plugin, args, messageData);
        }
        return false;
      }
    });
  }

  /**
   * Expose API for plugins
   */
  static exposeAPI() {
    this.api = {
      // Core classes
      TokenDisplay: window.RNKDisplays.TokenDisplay,
      DisplayConfigApp: window.RNKDisplays.DisplayConfigApp,
      DisplaySettings: window.RNKDisplays.DisplaySettings,
      
      // Managers
      VisualEffects: window.RNKDisplays.VisualEffects,
      ParticleSystem: window.RNKDisplays.ParticleSystem,
      CombatStatsManager: window.RNKDisplays.CombatStatsManager,
      TokenLinkManager: window.RNKDisplays.TokenLinkManager,
      ConcentrationTracker: window.RNKDisplays.ConcentrationTracker,
      
      // Utilities
      SystemIntegration: window.RNKDisplays.SystemIntegration,
      DisplayTemplateManager: window.RNKDisplays.DisplayTemplateManager,
      
      // Plugin system
      registerPlugin: (plugin) => this.registerPlugin(plugin),
      unregisterPlugin: (pluginId) => this.unregisterPlugin(pluginId),
      getPlugin: (pluginId) => this.getPlugin(pluginId),
      
      // Hooks
      on: (hookName, callback) => this.registerHook(hookName, callback),
      trigger: (hookName, ...args) => this.triggerHook(hookName, ...args),
      
      // Settings
      registerSetting: (key, config) => {
        game.settings.register("rnk-wasteland-hud", key, config);
      },
      getSetting: (key) => {
        return game.settings.get("rnk-wasteland-hud", key);
      },
      setSetting: (key, value) => {
        return game.settings.set("rnk-wasteland-hud", key, value);
      },
      
      // Token utilities
      getTokenDisplay: (token) => token.Display,
      refreshDisplay: (token) => {
        if (token.Display) {
          token.Display.refresh();
        }
      },
      
      // Visual effects
      createParticles: (token, effectType) => {
        if (token.Display) {
          token.Display.createParticleEffect(effectType);
        }
      },
      
      // Version
      version: "2.0.0"
    };

    return this.api;
  }

  /**
   * Register a custom hook
   */
  static registerHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push({ callback });
  }
}

/**
 * Example Plugin
 */
export class ExamplePlugin extends DisplayPlugin {
  constructor() {
    super("example-plugin", {
      name: "Example Plugin",
      version: "1.0.0",
      author: "RNK",
      description: "Example plugin demonstrating the plugin API"
    });
  }

  async initialize() {
    await super.initialize();

    // Register hook
    this.registerHook("createToken", (document, options, userId) => {
      console.log("Token created:", document.name);
    });

    // Register command
    this.registerCommand("example", (args) => {
      ui.notifications.info("Example plugin command executed!");
    }, "Example command");

    // Use plugin API
    const api = PluginSystem.api;
    
    // Register custom setting
    api.registerSetting("exampleSetting", {
      name: "Example Setting",
      hint: "This is an example setting",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });
  }

  onEnable() {
    console.log("Example plugin enabled");
  }

  onDisable() {
    console.log("Example plugin disabled");
  }
}

/**
 * Plugin Manager UI
 */
export class PluginManagerApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "plugin-manager",
      template: "modules/rnk-wasteland-hud/templates/plugin-manager.html",
      title: "RNK Wasteland HUD - Plugin Manager",
      width: 600,
      height: 400,
      resizable: true
    });
  }

  getData() {
    const plugins = PluginSystem.getAllPlugins();
    
    return {
      plugins: plugins.map(p => ({
        id: p.id,
        name: p.metadata.name,
        version: p.metadata.version,
        author: p.metadata.author,
        description: p.metadata.description,
        enabled: p.enabled,
        dependencies: p.metadata.dependencies.join(", ")
      }))
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".toggle-plugin").click((event) => {
      const pluginId = $(event.currentTarget).data("plugin-id");
      const plugin = PluginSystem.getPlugin(pluginId);
      
      if (plugin) {
        if (plugin.enabled) {
          PluginSystem.disablePlugin(pluginId);
        } else {
          PluginSystem.enablePlugin(pluginId);
        }
        this.render();
      }
    });

    html.find(".reload-plugins").click(() => {
      ui.notifications.info("Reloading plugins...");
      // Could implement plugin reload logic here
      this.render();
    });
  }
}

/**
 * Setup function
 */
export function setupPluginSystem() {
  console.log("RNK™ Wasteland HUD | Plugin system initialized");

  // Expose API
  PluginSystem.exposeAPI();

  // Make API globally available
  window.RNKDisplaysAPI = PluginSystem.api;

  // Register example plugin (for demonstration)
  // const examplePlugin = new ExamplePlugin();
  // PluginSystem.registerPlugin(examplePlugin);

  // Add UI button for GMs
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;

    const tokenControls = controls.find(c => c.name === "token");
    
    tokenControls.tools.push({
      name: "plugin-manager",
      title: "Manage Display Plugins",
      icon: "fas fa-plug",
      onClick: () => new PluginManagerApp().render(true),
      button: true
    });
  });

  // Chat command
  Hooks.on("chatMessage", (log, message, data) => {
    if (message === "/plugins") {
      new PluginManagerApp().render(true);
      return false;
    }
  });

  // Provide documentation
  console.log(`
RNK Wasteland HUD Plugin API v2.0.0
===================================

To create a plugin:

1. Extend the DisplayPlugin class:
   class MyPlugin extends window.RNKDisplaysAPI.DisplayPlugin { ... }

2. Register your plugin:
   const myPlugin = new MyPlugin();
   window.RNKDisplaysAPI.registerPlugin(myPlugin);

3. Use the API:
   const api = window.RNKDisplaysAPI;
   api.on('hookName', (data) => { ... });
   api.registerSetting('mySetting', { ... });

See documentation for full API reference.
  `);
}

// Export for global API
window.RNKDisplays = window.RNKDisplays || {};
Object.assign(window.RNKDisplays, {
  DisplayPlugin,
  PluginSystem,
  ExamplePlugin,
  PluginManagerApp
});


