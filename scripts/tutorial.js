import { DisplaySettings } from './settings.js';

/**
 * Interactive Tutorial System
 * Guides users through features step-by-step
 */

export class DisplayTutorial {
  static currentStep = 0;
  static tutorialSteps = [
    {
      title: "Welcome to RNK Wasteland HUD!",
      content: `
        <h3>Transform Your Tokens!</h3>
        <p>This tutorial will show you the amazing features of RNK Wasteland HUD.</p>
        <p>You'll learn how to:</p>
        <ul>
          <li>Enable and customize token Displays</li>
          <li>Use visual presets and effects</li>
          <li>Add particle effects and animations</li>
          <li>Track combat stats in real-time</li>
          <li>And much more!</li>
        </ul>
        <p><strong>Ready to begin?</strong></p>
      `,
      action: null,
      validation: null
    },
    {
      title: "Step 1: Enable a Display",
      content: `
        <p>Let's start by enabling a Display on a token!</p>
        <ol>
          <li>Select any token on the canvas</li>
          <li>Type this command in chat: <code>/Displays enable</code></li>
        </ol>
        <p>You should see a text display appear above the token!</p>
      `,
      action: () => {
        ui.notifications.info("Now try: Select a token and type /Displays enable");
      },
      validation: () => {
        return canvas.tokens.controlled.some(t => 
          t.document && DisplaySettings.getFlag(t.document, 'enabled')
        );
      }
    },
    {
      title: "Step 2: Try Different Presets",
      content: `
        <p>RNK Wasteland HUD includes 17 beautiful visual presets!</p>
        <ol>
          <li>Keep your token selected</li>
          <li>Right-click the token → Configure</li>
          <li>Go to the "Displays" tab</li>
          <li>Try different presets from the dropdown</li>
        </ol>
        <p>Popular presets: Fantasy Displays, Neon, Fire, Arcane</p>
      `,
      action: null,
      validation: null
    },
    {
      title: "Step 3: Add Particle Effects",
      content: `
        <p>Make your tokens come alive with particle effects!</p>
        <ol>
          <li>Select a token with a Display</li>
          <li>Type: <code>/particle fire</code></li>
          <li>Try other types: ice, lightning, healing, arcane, shadow, poison</li>
        </ol>
        <p>To remove: <code>/particle clear</code></p>
      `,
      action: () => {
        ui.notifications.info("Try: /particle fire (or ice, lightning, healing, etc.)");
      },
      validation: null
    },
    {
      title: "Step 4: Speech Bubbles",
      content: `
        <p>Add roleplaying flair with speech bubbles!</p>
        <ol>
          <li>Select a token</li>
          <li>Type: <code>/bubble speech Hello, adventurers!</code></li>
          <li>Try: <code>/bubble thought I wonder...</code></li>
          <li>Or: <code>/bubble note Important!</code></li>
        </ol>
      `,
      action: () => {
        ui.notifications.info("Try: /bubble speech Hello!");
      },
      validation: null
    },
    {
      title: "Step 5: Combat Features",
      content: `
        <p>Track combat with real-time statistics!</p>
        <p><strong>Combat Stats:</strong> Automatically tracks damage, healing, and kills</p>
        <p><strong>Turn Timer:</strong> Type <code>/timer reset 30</code> for a 30-second countdown</p>
        <p><strong>Quick Actions:</strong> Type <code>/actions show</code> for action buttons</p>
        <p><strong>Cinematic Effects:</strong> Type <code>/cinematic crit</code> for epic moments!</p>
      `,
      action: null,
      validation: null
    },
    {
      title: "Step 6: Advanced Features",
      content: `
        <p>Explore these powerful features:</p>
        <ul>
          <li><strong>Party Frames:</strong> <code>/party</code> - MMO-style party display</li>
          <li><strong>Token Links:</strong> <code>/link ally</code> - Show relationships</li>
          <li><strong>Concentration:</strong> <code>/concentrate Fireball</code> - Track spells</li>
          <li><strong>Inventory:</strong> <code>/inventory</code> - Quick item access</li>
          <li><strong>Preset Builder:</strong> <code>/preset-builder</code> - Create custom themes</li>
          <li><strong>Multiplayer:</strong> Shift+Click to ping, real-time cursors</li>
        </ul>
      `,
      action: null,
      validation: null
    },
    {
      title: "Tutorial Complete!",
      content: `
        <h3>You're now a RNK Wasteland HUD expert!</h3>
        <p><strong>Quick Reference:</strong></p>
        <ul>
          <li><code>/Displays enable/disable/refresh</code></li>
          <li><code>/bubble speech/thought/note [text]</code></li>
          <li><code>/particle [type]</code></li>
          <li><code>/timer reset [seconds]</code></li>
          <li><code>/party</code>, <code>/inventory</code>, <code>/preset-builder</code></li>
          <li><code>/cinematic [effect]</code></li>
        </ul>
        <p>Check the documentation for even more features!</p>
        <p><strong>Enjoy creating amazing tokens!</strong></p>
      `,
      action: () => {
        ChatMessage.create({
          content: `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        padding: 20px; border-radius: 10px; color: white; text-align: center;">
              <h2>Tutorial Complete!</h2>
              <p>You're ready to create amazing tokens!</p>
            </div>
          `
        });
      },
      validation: null
    }
  ];

  static async start() {
    this.currentStep = 0;
    await this.showStep(0);
  }

  static async showStep(step) {
    const tutorialData = this.tutorialSteps[step];
    if (!tutorialData) return;

    const buttons = {};
    
    if (step > 0) {
      buttons.back = {
        label: "← Back",
        callback: () => this.showStep(step - 1)
      };
    }
    
    if (step < this.tutorialSteps.length - 1) {
      buttons.next = {
        label: "Next →",
        callback: () => {
          if (tutorialData.validation && !tutorialData.validation()) {
            ui.notifications.warn("Complete this step first!");
            return false;
          }
          this.showStep(step + 1);
        }
      };
    } else {
      buttons.finish = {
        label: "Finish",
        callback: () => {
          game.settings.set(DisplaySettings.NAMESPACE, 'tutorialCompleted', true);
          ui.notifications.info("Tutorial complete! Have fun!");
        }
      };
    }

    buttons.skip = {
      label: "Skip Tutorial",
      callback: () => {
        game.settings.set(DisplaySettings.NAMESPACE, 'tutorialCompleted', true);
      }
    };

    new Dialog({
      title: tutorialData.title,
      content: tutorialData.content,
      buttons,
      default: step < this.tutorialSteps.length - 1 ? "next" : "finish",
      render: () => {
        if (tutorialData.action) tutorialData.action();
      }
    }, {
      width: 600,
      height: "auto"
    }).render(true);
  }
}

// Auto-start tutorial for new users
Hooks.once('ready', () => {
  if (!game.settings?.settings?.has(`${DisplaySettings.NAMESPACE}.tutorialCompleted`)) {
    DisplaySettings.registerSettings();
  }
  if (!game.settings.get(DisplaySettings.NAMESPACE, 'tutorialCompleted')) {
    setTimeout(() => {
      new Dialog({
        title: "Welcome to RNK Wasteland HUD!",
        content: `
          <p>Would you like a quick tutorial to learn the features?</p>
          <p>It takes about 5 minutes and covers all the main features.</p>
        `,
        buttons: {
          yes: {
            label: "Yes, show me!",
            callback: () => DisplayTutorial.start()
          },
          no: {
            label: "No thanks",
            callback: () => game.settings.set(DisplaySettings.NAMESPACE, 'tutorialCompleted', true)
          }
        },
        default: "yes"
      }).render(true);
    }, 3000); // Wait 3 seconds after load
  }
});

// Chat command to restart tutorial
Hooks.on('chatMessage', (chatLog, message) => {
  if (message.trim().toLowerCase() === '/tutorial') {
    DisplayTutorial.start();
    return false;
  }
  return true;
});

