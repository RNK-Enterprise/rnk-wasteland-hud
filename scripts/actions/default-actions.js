/**
 * RNK™ Wasteland HUD - Default Actions
 * Provides standard action definitions
 * @module actions/default-actions
 */

export function getDefaultActions(token) {
  return [
    {
      id: "attack",
      label: "Attack",
      icon: "fa-solid fa-swords",
      color: 0xFF4444,
      hotkey: "1",
      callback: async () => {
        const actor = token.actor;
        if (!actor) return;
        
        const weapons = actor.items.filter(i => i.type === "weapon");
        if (weapons.length === 0) {
          ui.notifications.warn("No weapons found!");
          return;
        }
        
        if (weapons.length === 1) {
          weapons[0].rollAttack();
        } else {
          showWeaponSelector(weapons, "attack", token);
        }
      }
    },
    {
      id: "defend",
      label: "Defend",
      icon: "fa-solid fa-shield",
      color: 0x4444FF,
      hotkey: "2",
      callback: async () => {
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ token }),
          content: `${token.name} takes the Defend action!`
        });
      }
    },
    {
      id: "dash",
      label: "Dash",
      icon: "fa-solid fa-wind",
      color: 0x44FF44,
      hotkey: "3",
      callback: async () => {
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ token }),
          content: `${token.name} dashes!`
        });
      }
    },
    {
      id: "heal",
      label: "Heal",
      icon: "fa-solid fa-heart",
      color: 0xFF44FF,
      hotkey: "4",
      callback: async () => {
        const actor = token.actor;
        if (!actor) return;
        
        const potions = actor.items.filter(i => 
          i.type === "consumable" && 
          i.name.toLowerCase().includes("potion") &&
          i.name.toLowerCase().includes("heal")
        );
        
        if (potions.length > 0) {
          potions[0].use();
        } else {
          ui.notifications.warn("No healing potions found!");
        }
      }
    }
  ];
}

export function showWeaponSelector(weapons, actionType, token) {
  const content = `
    <div class="weapon-selector">
      <p>Choose a weapon:</p>
      ${weapons.map((w, i) => `
        <button class="weapon-choice" data-index="${i}">
          ${w.name}
        </button>
      `).join("")}
    </div>
  `;
  
  new Dialog({
    title: "Select Weapon",
    content: content,
    buttons: {},
    render: (html) => {
      html = $(html);
      html.find(".weapon-choice").click((e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        const weapon = weapons[index];
        
        if (actionType === "attack") {
          weapon.rollAttack();
        } else if (actionType === "damage") {
          weapon.rollDamage();
        }
        
        html.closest(".app").find(".close").click();
      });
    }
  }).render(true);
}
