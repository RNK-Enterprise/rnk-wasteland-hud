/**
 * Speech & Thought Bubbles System
 * Comic-style bubbles for chat messages and GM notes
 * @module SpeechBubbles
 */

import { DisplaySettings } from "./settings.js";

/**
 * Speech or Thought Bubble Display
 * @class SpeechBubble
 * @extends PIXI.Container
 */
export class SpeechBubble extends PIXI.Container {
  constructor(text, options = {}) {
    super();
    
    this.text = text;
    this.isThought = options.isThought || false;
    this.duration = options.duration || 5000;
    this.maxWidth = options.maxWidth || 250;
    this.fontSize = options.fontSize || 14;
    this.backgroundColor = options.backgroundColor || 0xFFFFFF;
    this.textColor = options.textColor || 0x000000;
    this.borderColor = options.borderColor || 0x000000;
    this.opacity = options.opacity || 0.95;
    
    this.bubble = null;
    this.tail = null;
    this.textElement = null;
    this.clouds = [];
    
    this.createBubble();
    this.startFadeTimer();
  }
  
  /**
   * Create the bubble visual
   */
  createBubble() {
    // Create text first to measure
    const style = new PIXI.TextStyle({
      fontFamily: "Arial, sans-serif",
      fontSize: this.fontSize,
      fill: this.textColor,
      wordWrap: true,
      wordWrapWidth: this.maxWidth - 20,
      align: "left",
      lineHeight: this.fontSize * 1.2
    });
    
    this.textElement = new PIXI.Text(this.text, style);
    this.textElement.x = 10;
    this.textElement.y = 10;
    
    const padding = 10;
    const width = this.textElement.width + (padding * 2);
    const height = this.textElement.height + (padding * 2);
    
    // Create bubble background
    this.bubble = new PIXI.Graphics();
    
    if (this.isThought) {
      // Thought bubble (cloud-like)
      this.createThoughtBubble(width, height);
    } else {
      // Speech bubble (rounded rectangle)
      this.createSpeechBubble(width, height);
    }
    
    this.bubble.alpha = this.opacity;
    
    // Add elements
    this.addChild(this.bubble);
    this.addChild(this.textElement);
    
    // Create tail
    this.createTail();
    
    // Position above token
    this.y = -height - 40;
  }
  
  /**
   * Create speech bubble (rounded rectangle with tail)
   */
  createSpeechBubble(width, height) {
    this.bubble.lineStyle(2, this.borderColor, 1);
    this.bubble.beginFill(this.backgroundColor);
    this.bubble.drawRoundedRect(0, 0, width, height, 10);
    this.bubble.endFill();
  }
  
  /**
   * Create thought bubble (cloud-like shape)
   */
  createThoughtBubble(width, height) {
    // Main cloud
    this.bubble.lineStyle(2, this.borderColor, 1);
    this.bubble.beginFill(this.backgroundColor);
    
    // Draw multiple overlapping circles to create cloud effect
    const numCircles = 8;
    const circleRadius = Math.min(width, height) / 4;
    
    for (let i = 0; i < numCircles; i++) {
      const angle = (i / numCircles) * Math.PI * 2;
      const x = (width / 2) + Math.cos(angle) * (width / 2 - circleRadius);
      const y = (height / 2) + Math.sin(angle) * (height / 2 - circleRadius);
      this.bubble.drawCircle(x, y, circleRadius);
    }
    
    // Fill center
    this.bubble.drawCircle(width / 2, height / 2, circleRadius * 1.2);
    this.bubble.endFill();
  }
  
  /**
   * Create tail pointing to token
   */
  createTail() {
    this.tail = new PIXI.Graphics();
    
    if (this.isThought) {
      // Thought bubble tail (small circles)
      const bubbles = [
        { x: this.bubble.width / 2, y: this.bubble.height + 5, r: 8 },
        { x: this.bubble.width / 2 - 5, y: this.bubble.height + 15, r: 5 },
        { x: this.bubble.width / 2 - 10, y: this.bubble.height + 25, r: 3 }
      ];
      
      this.tail.lineStyle(2, this.borderColor, 1);
      this.tail.beginFill(this.backgroundColor);
      bubbles.forEach(b => {
        this.tail.drawCircle(b.x, b.y, b.r);
      });
      this.tail.endFill();
    } else {
      // Speech bubble tail (triangle)
      const points = [
        this.bubble.width / 2 - 10, this.bubble.height,
        this.bubble.width / 2 + 10, this.bubble.height,
        this.bubble.width / 2 - 5, this.bubble.height + 20
      ];
      
      this.tail.lineStyle(2, this.borderColor, 1);
      this.tail.beginFill(this.backgroundColor);
      this.tail.drawPolygon(points);
      this.tail.endFill();
    }
    
    this.tail.alpha = this.opacity;
    this.addChild(this.tail);
  }
  
  /**
   * Start fade-out timer
   */
  startFadeTimer() {
    setTimeout(() => {
      this.fadeOut();
    }, this.duration);
  }
  
  /**
   * Fade out animation
   */
  fadeOut() {
    const duration = 500;
    const startTime = Date.now();
    const startAlpha = this.alpha;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.alpha = startAlpha * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.destroy();
      }
    };
    
    animate();
  }
  
  /**
   * Cleanup
   */
  destroy(options) {
    if (this.bubble) this.bubble.destroy();
    if (this.tail) this.tail.destroy();
    if (this.textElement) this.textElement.destroy();
    this.clouds.forEach(c => c.destroy());
    super.destroy(options);
  }
}

/**
 * Speech Bubble Manager
 * Manages bubble creation and display
 */
export class SpeechBubbleManager {
  static bubbles = new Map(); // token.id -> [bubbles]
  
  /**
   * Show a speech bubble for a token
   * @param {Token} token - Token to show bubble for
   * @param {string} text - Text to display
   * @param {object} options - Bubble options
   */
  static show(token, text, options = {}) {
    if (!token || !token.Display) return;
    
    // Create bubble
    const bubble = new SpeechBubble(text, options);
    
    // Add to Display
    token.Display.addChild(bubble);
    
    // Position bubble
    bubble.x = token.Display.background.width / 2 - bubble.bubble.width / 2;
    
    // Track bubble
    if (!this.bubbles.has(token.id)) {
      this.bubbles.set(token.id, []);
    }
    this.bubbles.get(token.id).push(bubble);
    
    // Remove old bubbles if too many
    const maxBubbles = options.maxBubbles || 3;
    const tokenBubbles = this.bubbles.get(token.id);
    if (tokenBubbles.length > maxBubbles) {
      const oldBubble = tokenBubbles.shift();
      oldBubble.fadeOut();
    }
    
    // Auto-remove from tracking when destroyed
    bubble.once('destroyed', () => {
      const bubbles = this.bubbles.get(token.id);
      if (bubbles) {
        const index = bubbles.indexOf(bubble);
        if (index > -1) bubbles.splice(index, 1);
      }
    });
    
    return bubble;
  }
  
  /**
   * Show speech bubble
   */
  static showSpeech(token, text, options = {}) {
    return this.show(token, text, { ...options, isThought: false });
  }
  
  /**
   * Show thought bubble
   */
  static showThought(token, text, options = {}) {
    return this.show(token, text, { ...options, isThought: true });
  }
  
  /**
   * Show GM note (private bubble for GM)
   */
  static showGMNote(token, text, options = {}) {
    if (!game.user.isGM) return;
    
    return this.show(token, text, {
      ...options,
      backgroundColor: 0xFFFFCC,
      borderColor: 0xFFAA00,
      duration: options.duration || 10000
    });
  }
  
  /**
   * Clear all bubbles for a token
   */
  static clear(token) {
    const bubbles = this.bubbles.get(token.id);
    if (bubbles) {
      bubbles.forEach(b => b.fadeOut());
      this.bubbles.delete(token.id);
    }
  }
  
  /**
   * Clear all bubbles
   */
  static clearAll() {
    this.bubbles.forEach((bubbles, tokenId) => {
      bubbles.forEach(b => b.fadeOut());
    });
    this.bubbles.clear();
  }
}

/**
 * Setup speech bubble integration with Foundry
 */
export function setupSpeechBubbles() {
  console.log("RNK™ Wasteland HUD | Speech Bubbles initialized");
  
  // Hook into chat messages
  Hooks.on("createChatMessage", (message) => {
    const speaker = message.speaker;
    if (!speaker || !speaker.token) return;
    
    const token = canvas.tokens.get(speaker.token);
    if (!token || !token.Display) return;
    
    // Check if Display has speech bubbles enabled
    const config = DisplaySettings.getFlag(token.document, "config") || {};
    if (config.enableSpeechBubbles === false) return;
    
    // Determine bubble type
    const isWhisper = message.whisper && message.whisper.length > 0;
    const isOOC = message.content.startsWith("((") || message.type === CONST.CHAT_MESSAGE_TYPES.OOC;
    
    if (isWhisper) {
      // Whispers are thoughts
      SpeechBubbleManager.showThought(token, message.content, {
        duration: 4000
      });
    } else if (isOOC) {
      // OOC is thought
      const cleanText = message.content.replace(/^\(\(|\)\)$/g, "");
      SpeechBubbleManager.showThought(token, cleanText, {
        duration: 4000
      });
    } else {
      // Normal chat is speech
      SpeechBubbleManager.showSpeech(token, message.content, {
        duration: 5000
      });
    }
  });
  
  // Add context menu option
  Hooks.on("getTokenHUDData", (token, data) => {
    // Add to context menu in future
  });
  
  // Add chat command
  Hooks.on("chatMessage", (log, message, data) => {
    if (message.startsWith("/bubble")) {
      const args = message.split(" ");
      const command = args[1];
      
      const token = canvas.tokens.controlled[0];
      if (!token) {
        ui.notifications.warn("Select a token first!");
        return false;
      }
      
      switch(command) {
        case "speech":
          const speechText = args.slice(2).join(" ");
          SpeechBubbleManager.showSpeech(token, speechText);
          return false;
          
        case "thought":
          const thoughtText = args.slice(2).join(" ");
          SpeechBubbleManager.showThought(token, thoughtText);
          return false;
          
        case "note":
          if (!game.user.isGM) {
            ui.notifications.warn("Only GM can show notes!");
            return false;
          }
          const noteText = args.slice(2).join(" ");
          SpeechBubbleManager.showGMNote(token, noteText);
          return false;
          
        case "clear":
          SpeechBubbleManager.clear(token);
          ui.notifications.info("Bubbles cleared!");
          return false;
      }
    }
  });
}

// Export for global access
window.SpeechBubbleManager = SpeechBubbleManager;

