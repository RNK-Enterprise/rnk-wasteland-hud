/**
 * RNK™ Wasteland HUD - Shared Note
 * Draggable collaborative notes on canvas
 * @module multiplayer/shared-note
 */

export class SharedNote extends PIXI.Container {
  constructor(data) {
    super();

    this.data = {
      id: data.id || foundry.utils.randomID(),
      text: data.text || "",
      x: data.x || 0,
      y: data.y || 0,
      color: data.color || 0xffff00,
      author: data.author || game.user.name,
      ...data
    };

    this.position.set(this.data.x, this.data.y);
    this.interactive = true;
    this.cursor = "move";

    this._createNote();
    this._setupInteraction();
  }

  _createNote() {
    const bg = new PIXI.Graphics();
    bg.beginFill(this.data.color, 0.9);
    bg.drawRect(0, 0, 200, 100);
    bg.endFill();
    bg.lineStyle(2, 0x000000, 1);
    bg.drawRect(0, 0, 200, 100);
    this.addChild(bg);

    const text = new PIXI.Text(this.data.text, {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0x000000,
      wordWrap: true,
      wordWrapWidth: 180
    });
    text.position.set(10, 10);
    this.addChild(text);

    const author = new PIXI.Text(`- ${this.data.author}`, {
      fontFamily: "Arial",
      fontSize: 10,
      fill: 0x666666,
      fontStyle: "italic"
    });
    author.position.set(10, 80);
    this.addChild(author);
  }

  _setupInteraction() {
    let dragging = false;
    let dragStart = null;

    this.on("pointerdown", (event) => {
      dragging = true;
      dragStart = event.data.getLocalPosition(this.parent);
      dragStart.x -= this.x;
      dragStart.y -= this.y;
    });

    this.on("pointermove", (event) => {
      if (dragging) {
        const pos = event.data.getLocalPosition(this.parent);
        this.position.set(pos.x - dragStart.x, pos.y - dragStart.y);
        
        game.socket.emit("module.rnk-wasteland-hud", {
          type: "moveNote",
          noteId: this.data.id,
          x: this.x,
          y: this.y
        });
      }
    });

    this.on("pointerup", () => {
      dragging = false;
    });

    this.on("pointerupoutside", () => {
      dragging = false;
    });

    this.on("rightdown", () => {
      this._showContextMenu();
    });
  }

  _showContextMenu() {
    new ContextMenu($(document.body), ".shared-note", [
      {
        name: "Edit Note",
        icon: '<i class="fas fa-edit"></i>',
        callback: () => this._editNote()
      },
      {
        name: "Delete Note",
        icon: '<i class="fas fa-trash"></i>',
        callback: () => this._deleteNote()
      }
    ]);
  }

  async _editNote() {
    const newText = await new Promise((resolve) => {
      new Dialog({
        title: "Edit Note",
        content: `
          <form>
            <div class="form-group">
              <textarea name="text" rows="5">${this.data.text}</textarea>
            </div>
          </form>
        `,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: "Save",
            callback: (html) => resolve(html.find('textarea[name="text"]').val())
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "save"
      }).render(true);
    });

    if (newText !== null) {
      this.data.text = newText;
      this.removeChildren();
      this._createNote();

      game.socket.emit("module.rnk-wasteland-hud", {
        type: "updateNote",
        noteId: this.data.id,
        text: newText
      });
    }
  }

  _deleteNote() {
    game.socket.emit("module.rnk-wasteland-hud", {
      type: "deleteNote",
      noteId: this.data.id
    });

    const { MultiplayerFeatures } = require('./multiplayer-manager.js');
    MultiplayerFeatures.removeNote(this.data.id);
  }
}
