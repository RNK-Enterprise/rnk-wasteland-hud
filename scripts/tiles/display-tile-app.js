/**
 * RNK Wasteland HUD - Interactive Tile Application
 * Displays character information in a tab-based HUD interface
 * Players can manage inventory, spells, attacks, and skills from this interface
 */

class DisplayTileApp extends Application {
  constructor(tile, actorId, options = {}) {
    super(options);
    this.tile = tile;
    this.actorId = actorId;
    this.actor = game.actors.get(actorId);
    this.currentTab = 'inventory'; // Default tab
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'display-tile-app',
      title: 'Character Quick Access',
      template: 'modules/rnk-wasteland-hud/templates/display-tile-app.hbs',
      width: 500,
      height: 600,
      resizable: true,
      popOut: true,
      tabs: [
        { navSelector: '.Display-tabs', contentSelector: '.Display-content', initial: 'inventory' }
      ]
    });
  }

  /**
   * Provide data to the template
   */
  getData() {
    if (!this.actor) {
      return { error: 'Actor not found' };
    }

    const data = {
      actor: this.actor,
      tabs: [
        { id: 'inventory', label: 'Inventory', icon: 'fas fa-backpack' },
        { id: 'spells', label: 'Spells', icon: 'fas fa-wand-magic-sparkles' },
        { id: 'attacks', label: 'Attacks', icon: 'fas fa-sword' },
        { id: 'skills', label: 'Skills', icon: 'fas fa-person-hiking' }
      ]
    };

    // Add tab-specific data
    switch (this.currentTab) {
      case 'inventory':
        data.items = this.getInventoryItems();
        break;
      case 'spells':
        data.spells = this.getSpells();
        break;
      case 'attacks':
        data.attacks = this.getAttacks();
        break;
      case 'skills':
        data.skills = this.getSkills();
        break;
    }

    return data;
  }

  /**
   * Get inventory items from the actor
   */
  getInventoryItems() {
    if (!this.actor.items) return [];

    return this.actor.items
      .filter(item => item.type === 'loot' || item.type === 'equipment' || item.type === 'weapon')
      .map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        quantity: item.system?.quantity || 1,
        weight: item.system?.weight || 0,
        rarity: item.system?.rarity || '',
        equipped: item.system?.equipped || false,
        img: item.img
      }));
  }

  /**
   * Get spells from the actor
   */
  getSpells() {
    if (!this.actor.items) return [];

    return this.actor.items
      .filter(item => item.type === 'spell')
      .map(item => ({
        id: item.id,
        name: item.name,
        level: item.system?.level || 0,
        school: item.system?.school || '',
        prepared: item.system?.prepared || false,
        concentration: item.system?.concentration || false,
        castingTime: item.system?.activation?.type || '',
        range: item.system?.range?.value || '',
        duration: item.system?.duration?.value || '',
        description: item.system?.description?.value || '',
        img: item.img
      }));
  }

  /**
   * Get attacks (weapons and martial features) from the actor
   */
  getAttacks() {
    if (!this.actor.items) return [];

    return this.actor.items
      .filter(item => item.type === 'weapon' || item.type === 'feat')
      .map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        damage: item.system?.damage?.parts?.[0]?.[0] || '',
        damageType: item.system?.damage?.parts?.[0]?.[1] || '',
        toHit: item.system?.attack?.bonus || '',
        range: item.system?.range?.value || 'melee',
        description: item.system?.description?.value || '',
        img: item.img
      }));
  }

  /**
   * Get skills from the actor
   */
  getSkills() {
    if (!this.actor.system?.skills) return [];

    const skills = [];
    for (const [skillKey, skillData] of Object.entries(this.actor.system.skills)) {
      skills.push({
        key: skillKey,
        name: skillData.label || skillKey,
        bonus: skillData.total || 0,
        ability: skillData.ability || '',
        proficient: skillData.proficient || 0,
        description: ''
      });
    }
    return skills;
  }

  /**
   * Activate event listeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Tab switching
    html.find('.Display-tabs button').on('click', (e) => {
      e.preventDefault();
      const tabName = e.currentTarget.dataset.tab;
      this.currentTab = tabName;
      this._tabs[0].activate(tabName);
      this.render();
    });

    // Inventory item management
    html.find('.inventory-item').on('click', (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      this.handleInventoryAction(itemId, 'use');
    });

    html.find('.equip-item').on('click', (e) => {
      e.stopPropagation();
      const itemId = e.currentTarget.closest('.inventory-item').dataset.itemId;
      this.handleInventoryAction(itemId, 'equip');
    });

    // Spell casting
    html.find('.spell-item').on('click', (e) => {
      const spellId = e.currentTarget.dataset.spellId;
      this.handleSpellAction(spellId, 'view');
    });

    html.find('.cast-spell').on('click', (e) => {
      e.stopPropagation();
      const spellId = e.currentTarget.closest('.spell-item').dataset.spellId;
      this.handleSpellAction(spellId, 'cast');
    });

    html.find('.prepare-spell').on('click', (e) => {
      e.stopPropagation();
      const spellId = e.currentTarget.closest('.spell-item').dataset.spellId;
      this.handleSpellAction(spellId, 'prepare');
    });

    // Attack actions
    html.find('.attack-item').on('click', (e) => {
      const attackId = e.currentTarget.dataset.attackId;
      this.handleAttackAction(attackId, 'view');
    });

    html.find('.use-attack').on('click', (e) => {
      e.stopPropagation();
      const attackId = e.currentTarget.closest('.attack-item').dataset.attackId;
      this.handleAttackAction(attackId, 'use');
    });

    // Skill usage
    html.find('.skill-item').on('click', (e) => {
      const skillKey = e.currentTarget.dataset.skillKey;
      this.handleSkillAction(skillKey);
    });
  }

  /**
   * Handle inventory item actions
   */
  handleInventoryAction(itemId, action) {
    const item = this.actor.items.get(itemId);
    if (!item) return;

    switch (action) {
      case 'use':
        // Roll item (use item effect)
        if (item.roll) item.roll();
        break;
      case 'equip':
        // Toggle equipped state
        item.update({ 'system.equipped': !item.system.equipped });
        break;
    }
  }

  /**
   * Handle spell actions
   */
  handleSpellAction(spellId, action) {
    const spell = this.actor.items.get(spellId);
    if (!spell) return;

    switch (action) {
      case 'view':
        // Show spell details in a tooltip/popup
        spell.sheet.render(true);
        break;
      case 'cast':
        // Cast the spell (send socket message to allow server-side handling)
        this.emitSpellCast(spellId);
        break;
      case 'prepare':
        // Toggle prepared state
        spell.update({ 'system.prepared': !spell.system.prepared });
        break;
    }
  }

  /**
   * Handle attack actions
   */
  handleAttackAction(attackId, action) {
    const attack = this.actor.items.get(attackId);
    if (!attack) return;

    switch (action) {
      case 'view':
        attack.sheet.render(true);
        break;
      case 'use':
        // Roll attack (create a chat message with the attack roll)
        if (attack.roll) {
          attack.roll();
        } else {
          // Fallback: roll d20 + to-hit bonus
          const bonus = attack.system?.attack?.bonus || 0;
          const roll = new Roll(`1d20 + ${bonus}`);
          roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
        }
        break;
    }
  }

  /**
   * Handle skill actions
   */
  handleSkillAction(skillKey) {
    const skillData = this.actor.system.skills[skillKey];
    if (!skillData) return;

    // Roll skill check
    const bonus = skillData.total || 0;
    const skillName = skillData.label || skillKey;
    const roll = new Roll(`1d20 + ${bonus}`);
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.actor.name} makes a ${skillName} check`
    });
  }

  /**
   * Emit spell cast event via socket (for GM handling)
   */
  emitSpellCast(spellId) {
    const spell = this.actor.items.get(spellId);
    if (!spell) return;

    // If the user is the actor's owner, allow the cast
    if (this.actor.isOwner) {
      // Use the spell (roll it or apply its effects)
      if (spell.roll) {
        spell.roll();
      } else {
        ui.notifications.info(`Casting ${spell.name}`);
      }
    } else {
      // Request GM to handle the cast
      game.socket.emit('module.rnk-wasteland-hud', {
        type: 'spellCast',
        actorId: this.actor.id,
        spellId: spellId,
        userId: game.user.id
      });
    }
  }
}

/**
 * Register socket handlers for tile interactions
 */
export function registerDisplayTileSocketHandlers() {
  game.socket.on('module.rnk-wasteland-hud', (data) => {
    if (!game.user.isGM) return;

    const actor = game.actors.get(data.actorId);
    if (!actor) return;

    const spell = actor.items.get(data.spellId);
    if (!spell) return;

    switch (data.type) {
      case 'spellCast':
        if (spell.roll) {
          spell.roll();
        } else {
          ui.notifications.info(`${actor.name} casts ${spell.name}`);
        }
        break;
    }
  });
}

