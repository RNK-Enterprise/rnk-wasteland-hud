/**
 * RNK Wasteland HUD - Settings Manager
 * Handles all module settings and configurations
 */

export class DisplaySettings {
  static NAMESPACE = "rnk-wasteland-hud";
  static OLD_NAMESPACE = "rnk-wasteland-hud"; // For backwards compatibility

  /**
   * Safely get a flag with backwards compatibility
   * @param {Document} document - The document to get the flag from
   * @param {string} key - The flag key
   * @returns {*} The flag value or undefined
   */
  static getFlag(document, key) {
    try {
      const value = document.getFlag(this.NAMESPACE, key);
      if (value !== undefined) return value;
    } catch (e) {
      // New namespace not available
    }
    
    try {
      return document.getFlag(this.OLD_NAMESPACE, key);
    } catch (e) {
      // Old namespace also not available
      return undefined;
    }
  }

  /**
   * Set a flag using the current namespace
   * @param {Document} document - The document to set the flag on
   * @param {string} key - The flag key
   * @param {*} value - The flag value
   */
  static async setFlag(document, key, value) {
    return await document.setFlag(this.NAMESPACE, key, value);
  }

  static registerSettings() {
    if (game.settings?.settings?.has(`${this.NAMESPACE}.defaultVisibility`)) return;
    // Default visibility mode for new Displays
    game.settings.register(this.NAMESPACE, "defaultVisibility", {
      name: "Default Visibility Mode",
      hint: "How Displays should be displayed by default for new tokens",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "always": "Always Visible",
        "hover": "On Hover",
        "selected": "When Selected",
        "combat": "During Combat Only",
        "gm-only": "GM Only"
      },
      default: "always"
    });

    // Default style preset
    game.settings.register(this.NAMESPACE, "defaultPreset", {
      name: "Default Style Preset",
      hint: "Default visual style for new Displays",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "classic": "Classic",
        "fantasy": "Fantasy Displays",
        "modern": "Modern",
        "minimal": "Minimal",
        "scifi": "Sci-Fi",
        "parchment": "Parchment",
        "neon": "Neon Glow"
      },
      default: "fantasy"
    });

    // Enable animations
    game.settings.register(this.NAMESPACE, "enableAnimations", {
      name: "Enable Animations",
      hint: "Enable fade, pulse, and other visual animations",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // Player can toggle their own Displays
    game.settings.register(this.NAMESPACE, "playerToggle", {
      name: "Allow Player Toggle",
      hint: "Let players show/hide Displays on their own tokens",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // Show HP bars
    game.settings.register(this.NAMESPACE, "showProgressBars", {
      name: "Show Progress Bars by Default",
      hint: "Display HP and resource progress bars on new Displays",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // Combat highlighting
    game.settings.register(this.NAMESPACE, "combatHighlight", {
      name: "Highlight Active Combatant",
      hint: "Highlight the Display of the active combatant with a special effect",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // Distance-based fade
    game.settings.register(this.NAMESPACE, "distanceFade", {
      name: "Distance-Based Visibility",
      hint: "Fade out Displays when tokens are far from the camera (measured in grid units)",
      scope: "world",
      config: true,
      type: Number,
      default: 0,
      range: {
        min: 0,
        max: 50,
        step: 5
      }
    });

    // Show conditions
    game.settings.register(this.NAMESPACE, "showConditions", {
      name: "Show Conditions/Effects",
      hint: "Display active conditions and status effects on Displays",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // Template storage
    game.settings.register(this.NAMESPACE, "templates", {
      name: "Display Templates",
      scope: "world",
      config: false,
      type: Object,
      default: {}
    });

    // Player visibility settings
    game.settings.register(this.NAMESPACE, "playerVisibility", {
      name: "Player Display Visibility",
      hint: "What information players can see on non-owned tokens",
      scope: "world",
      config: true,
      type: String,
      choices: {
        "all": "All Information",
        "basic": "Name and HP Only",
        "name-only": "Name Only",
        "none": "Nothing (GM Only)"
      },
      default: "basic"
    });

    // Icon library
    game.settings.register(this.NAMESPACE, "enableIcons", {
      name: "Enable Stat Icons",
      hint: "Show icons next to stats (requires Font Awesome)",
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    // Debug mode
    game.settings.register(this.NAMESPACE, "debugMode", {
      name: "Debug Mode",
      hint: "Enable console logging for troubleshooting",
      scope: "client",
      config: true,
      type: Boolean,
      default: false
    });

    // Tutorial completion tracking
    game.settings.register(this.NAMESPACE, "tutorialCompleted", {
      name: "Tutorial Completed",
      hint: "Whether the user has completed the tutorial",
      scope: "client",
      config: false,
      type: Boolean,
      default: false
    });
  }

  static get(key) {
    return game.settings.get(this.NAMESPACE, key);
  }

  static async set(key, value) {
    return await game.settings.set(this.NAMESPACE, key, value);
  }

  static log(...args) {
    if (this.get("debugMode")) {
      console.log("RNK™ Wasteland HUD |", ...args);
    }
  }
}

