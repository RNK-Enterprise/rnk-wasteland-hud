/* RNK Wasteland HUD - Scene Stats Widget
 * Minimal implementation to place actor stat widgets on a Scene so players
 * can view selected attributes without opening the character sheet.
 *
 * Features:
 * - Adds a Scene control button to open the Widget Config app
 * - Place widgets by clicking on the canvas
 * - Stores widget config in scene flags: scene.setFlag('rnk-wasteland-hud','sceneWidgets', [...])
 * - Renders widgets in the scene DOM so they pan/zoom with the canvas
 */

import { DisplaySettings } from "./settings.js";

const MODULE = DisplaySettings.NAMESPACE;

Hooks.once('ready', () => {
  // Add scene control button
  Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;
    const tokenControls = Array.isArray(controls) ? controls.find(c => c.name === 'token' || c.name === 'tokens') : (controls.token || controls.tokens || controls['token']);
    if (!tokenControls) return;
    // avoid duplicates
    if ((tokenControls.tools || []).some(t => t.name === 'rnk-place-widget')) return;

    tokenControls.tools = tokenControls.tools || [];
    tokenControls.tools.push({
      name: 'rnk-place-widget',
      title: 'RNK: Place Scene Stat Widget',
      icon: 'fas fa-th-large',
      onClick: () => {
        new RNKSceneWidgetConfig().render(true);
      },
      button: true,
      visible: true
    });
  });
});

// Render widgets when the scene or canvas updates
Hooks.on('renderScene', (_scene, html) => renderSceneWidgets());
Hooks.on('canvasPan', () => renderSceneWidgets());
Hooks.on('canvasReady', () => renderSceneWidgets());
Hooks.on('updateActor', () => renderSceneWidgets());

async function getSceneWidgets(scene = game.scenes.active) {
  if (!scene) return [];
  return (DisplaySettings.getFlag(scene, 'sceneWidgets') || []);
}

function clearWidgetsContainer() {
  const sceneEl = document.querySelector('.scene') || document.querySelector('#board');
  if (!sceneEl) return;
  const existing = sceneEl.querySelector('.rnk-scene-widgets-container');
  if (existing) existing.remove();
}

function renderSceneWidgets() {
  try {
    const sceneEl = document.querySelector('.scene');
    if (!sceneEl) return;

    // Ensure container is inside the scene element so it pans/zooms with canvas
    clearWidgetsContainer();
    const container = document.createElement('div');
    container.className = 'rnk-scene-widgets-container';
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.pointerEvents = 'none';
    sceneEl.appendChild(container);

    const scene = game.scenes.active;
    if (!scene) return;
    getSceneWidgets(scene).then(widgets => {
      for (const w of widgets) {
        try {
          const el = document.createElement('div');
          el.className = 'rnk-scene-widget';
          el.dataset.id = w.id;
          el.style.position = 'absolute';
          el.style.left = `${w.x}px`;
          el.style.top = `${w.y}px`;
          el.style.pointerEvents = 'auto';
          el.style.minWidth = '120px';
          el.style.padding = '6px 8px';
          el.style.border = '1px solid rgba(0,0,0,0.25)';
          el.style.background = 'rgba(0,0,0,0.55)';
          el.style.color = 'white';
          el.style.borderRadius = '6px';
          el.style.fontSize = '12px';
          el.style.zIndex = 50;

          const title = document.createElement('div');
          title.className = 'rnk-scene-widget-title';
          title.style.fontWeight = '600';
          title.style.marginBottom = '6px';
          title.textContent = w.title || (game.actors.get(w.actorId)?.name || 'Actor');
          el.appendChild(title);

          const list = document.createElement('div');
          list.className = 'rnk-scene-widget-list';

          const actor = game.actors.get(w.actorId);
          for (const attr of (w.attrs || [])) {
            const row = document.createElement('div');
            row.className = 'rnk-scene-widget-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.gap = '8px';

            const label = document.createElement('span');
            label.textContent = attr.label || attr.path;
            label.style.opacity = '0.9';

            const value = document.createElement('span');
            value.className = 'rnk-scene-widget-value';
            value.style.fontWeight = '700';

            let val = '';
            try {
              if (actor) {
                // Try multiple common actor data roots
                val = resolveActorPath(actor, attr.path);
              }
            } catch (e) {
              val = '';
            }

            value.textContent = (val === undefined || val === null) ? '' : String(val);
            row.appendChild(label);
            row.appendChild(value);
            list.appendChild(row);
          }

          el.appendChild(list);

          // Allow GMs to remove widget by double-click
          if (game.user.isGM) {
            el.addEventListener('dblclick', async (evt) => {
              evt.stopPropagation();
              const confirmed = await Dialog.confirm({
                title: 'Remove Widget?',
                content: 'Remove this scene stat widget? Double-click again to cancel.',
                yes: () => true,
                no: () => false
              });
              if (confirmed) {
                await removeWidget(w.id);
                renderSceneWidgets();
              }
            });
          }

          container.appendChild(el);
        } catch (inner) {
          console.error('RNK Wasteland HUD: Failed to render widget', inner);
        }
      }
    }).catch(e => console.warn('RNK Wasteland HUD: getSceneWidgets failed', e));
  } catch (err) {
    console.error('RNK Wasteland HUD: renderSceneWidgets error', err);
  }
}

function resolveActorPath(actor, path) {
  if (!actor || !path) return '';
  // Prefer system first, then data
  let val;
  try {
    val = foundry.utils.getProperty(actor.system ?? actor.data?.system ?? actor.data?.data, path);
  } catch (e) {
    try { val = foundry.utils.getProperty(actor.data?.data || actor.data?.system || actor.data, path); } catch (e2) { val = undefined; }
  }
  // If the resolved value is an object with value property (like hp), try common shapes
  if (val && typeof val === 'object') {
    if (val.value !== undefined) return val.value;
    if (val.max !== undefined && val.value !== undefined) return `${val.value}/${val.max}`;
  }
  return val;
}

async function removeWidget(id) {
  const scene = game.scenes.active;
  if (!scene) return;
  const widgets = (DisplaySettings.getFlag(scene, 'sceneWidgets') || []).filter(w => w.id !== id);
  await DisplaySettings.setFlag(scene, 'sceneWidgets', widgets);
}

// Simple FormApplication to configure widget and place it on scene
class RNKSceneWidgetConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'rnk-scene-widget-config',
      title: 'RNK: Scene Stat Widget',
      template: 'modules/rnk-wasteland-hud/templates/scene-stats-widget.html',
      width: 480,
      height: 'auto'
    });
  }

  constructor(options = {}, data = {}) {
    super(options, data);
    this.placing = false;
    this.widgetDraft = { id: randomID(), actorId: null, attrs: [], x: 100, y: 100, title: '' };
  }

  getData() {
    const actors = game.actors.contents.map(a => ({ id: a.id, name: a.name }));
    const common = [
      { label: 'HP (value/max)', path: 'attributes.hp' },
      { label: 'AC', path: 'attributes.ac' },
      { label: 'Strength', path: 'abilities.str.value' },
      { label: 'Dexterity', path: 'abilities.dex.value' },
      { label: 'Constitution', path: 'abilities.con.value' },
      { label: 'Intelligence', path: 'abilities.int.value' },
      { label: 'Wisdom', path: 'abilities.wis.value' },
      { label: 'Charisma', path: 'abilities.cha.value' }
    ];
    return { actors, widget: this.widgetDraft, common };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('#rnk-add-attr').click(ev => this._onAddAttr(ev, html));
    html.find('#rnk-start-place').click(ev => this._onStartPlace(ev, html));
    html.find('#rnk-save-widget').click(ev => this._onSaveWidget(ev, html));
  }

  _onAddAttr(event, html) {
    event.preventDefault();
    const label = html.find('#rnk-attr-label').val()?.trim();
    const path = html.find('#rnk-attr-path').val()?.trim();
    if (!path) return ui.notifications.warn('Please provide a data path for the attribute');
    this.widgetDraft.attrs.push({ label: label || path, path });
    this.render();
  }

  async _onStartPlace(event, html) {
    event.preventDefault();
    ui.notifications.info('Click on the scene to place the widget. Press ESC to cancel.');
    this.placing = true;

    const handler = async (ev) => {
      try {
        const sceneEl = document.querySelector('.scene');
        if (!sceneEl) return;
        const rect = sceneEl.getBoundingClientRect();
        // event.clientX/Y are global; calculate relative to scene top-left
        const x = Math.round(ev.clientX - rect.left);
        const y = Math.round(ev.clientY - rect.top);
        this.widgetDraft.x = x;
        this.widgetDraft.y = y;
        this.placing = false;
        document.removeEventListener('click', handler, true);
        document.removeEventListener('keydown', cancelHandler, true);
        this.render();
      } catch (e) {
        console.error('RNK Wasteland HUD: placement handler failed', e);
      }
    };
    const cancelHandler = (ev) => {
      if (ev.key === 'Escape') {
        this.placing = false;
        document.removeEventListener('click', handler, true);
        document.removeEventListener('keydown', cancelHandler, true);
        ui.notifications.info('Widget placement cancelled');
      }
    };

    document.addEventListener('click', handler, true);
    document.addEventListener('keydown', cancelHandler, true);
  }

  async _onSaveWidget(event, html) {
    event.preventDefault();
    const actorId = html.find('#rnk-widget-actor').val();
    if (!actorId) return ui.notifications.warn('Select an actor');
    this.widgetDraft.actorId = actorId;
    this.widgetDraft.title = html.find('#rnk-widget-title').val() || '';

    const scene = game.scenes.active;
    if (!scene) return ui.notifications.error('No active scene');
    const widgets = DisplaySettings.getFlag(scene, 'sceneWidgets') || [];
    widgets.push(this.widgetDraft);
    await DisplaySettings.setFlag(scene, 'sceneWidgets', widgets);
    ui.notifications.info('Scene widget saved');
    this.close();
    renderSceneWidgets();
  }

  // Override to persist edits if needed
  async _updateObject(event, formData) {
    // not used
  }
}

// Simple helper to generate random id
function randomID() {
  return Math.random().toString(36).slice(2, 10);
}
