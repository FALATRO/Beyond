/*:
 * @plugindesc Custom equip menu for this game.
 * @author FALATRO
 */

(function() {
    Scene_Equip.prototype.getActorMenuBoxName = function(actor) {
        var targetActor = actor || this._actor;
        if (targetActor) {
            return 'MenuBox_Actor' + targetActor.actorId();
        }
        return 'MenuBox_Actor1'; 
    };
    const _Scene_Equip_initialize = Scene_Equip.prototype.initialize;
    Scene_Equip.prototype.initialize = function() {
        _Scene_Equip_initialize.call(this);
        $gameParty.members().forEach(function(actor) {
            ImageManager.loadPicture('MenuBox_Actor' + actor.actorId());
        });
    };
    Scene_Equip.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);

        this._customBg = new Sprite();
        this._customBg.x = (Graphics.boxWidth - 550) / 2;  
        this._customBg.y = 126;                          
        this.addChild(this._customBg); 
        
        var initialActor = $gameParty.menuActor();
        if (initialActor) {
            this._customBg.bitmap = ImageManager.loadPicture('MenuBox_Actor' + initialActor.actorId());
        } else {
            this.updateMenuBoxGraphic();
        }
    };
    Scene_Equip.prototype.updateMenuBoxGraphic = function() {
        if (this._customBg && this._actor) {
            var imageName = this.getActorMenuBoxName();
            this._customBg.bitmap = ImageManager.loadPicture(imageName);
        }
    };
    Scene_Equip.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createStatusWindow();
        this.createSlotWindow();
        this.createItemWindow();
        this.refreshActor();
        
        this._slotWindow.activate();
        this._slotWindow.select(0);
    };

    Scene_Equip.prototype.onSlotCancel = function() {
        this.popScene();
    };

    Scene_Equip.prototype.createHelpWindow = function() {
        this._helpWindow = new Window_Help(2);
        this._helpWindow.x = 45 + 15;        
        this._helpWindow.y = 126 + 10;       
        this._helpWindow.width = 520;
        this._helpWindow.height = 65;
        this._helpWindow.opacity = 0; 
        this.addWindow(this._helpWindow);
    };

    Scene_Equip.prototype.createStatusWindow = function() {
        this._statusWindow = new Window_EquipStatus(45 + 15, 126 + 80); 
        this._statusWindow.width = 220;
        this._statusWindow.height = 185;
        this._statusWindow.opacity = 0; 
        this.addWindow(this._statusWindow);
    };

    Scene_Equip.prototype.createSlotWindow = function() {
        this._slotWindow = new Window_EquipSlot(45 + 245, 126 + 80, 275, 85); 
        this._slotWindow.setHelpWindow(this._helpWindow);
        this._slotWindow.setStatusWindow(this._statusWindow);
        this._slotWindow.setHandler('ok',       this.onSlotOk.bind(this));
        this._slotWindow.setHandler('cancel',   this.onSlotCancel.bind(this));
        
        this._slotWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._slotWindow.setHandler('pageup',   this.previousActor.bind(this));
        
        this._slotWindow.opacity = 0; 
        this.addWindow(this._slotWindow);
    };

    Scene_Equip.prototype.onActorChange = function() {
        this.refreshActor();
        this.updateMenuBoxGraphic(); 
        this._slotWindow.activate(); 
    };

    Scene_Equip.prototype.createItemWindow = function() {
        this._itemWindow = new Window_EquipItem(45 + 245, 126 + 165, 275, 100); 
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setStatusWindow(this._statusWindow);
        this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this._slotWindow.setItemWindow(this._itemWindow);
        this._itemWindow.opacity = 0; 
        this.addWindow(this._itemWindow);
    };

Window_EquipStatus.prototype.refresh = function() {
    this.contents.clear();
    if (this._actor) {
        this.changeTextColor(this.normalColor());
        this.drawText(this._actor.name(), 5, 0, this.width - 10, 'left');

        var targetedParams = [0, 2, 3]; 
   
        for (var i = 0; i < targetedParams.length; i++) {
            var paramId = targetedParams[i];
            var y = 45 + i * 36; 
            
            this.drawParamName(5, y, paramId);
            if (this._actor) {
                this.drawCurrentParam(100, y, paramId);
            }
            this.drawRightArrow(135, y);
            if (this._tempActor) {
                this.drawNewParam(160, y, paramId);
            }
        }


        var varY = 45 + 3 * 36;

        this.changeTextColor(this.systemColor());
        this.drawText("Energy", 5, varY, 110);

        this.changeTextColor(this.normalColor());

        var currentMax = this._actor ? this._actor.mmp : 0;

        this.drawText(currentMax, 115, varY, 32, 'right');
        this.drawRightArrow(135, varY);

        if (this._tempActor) {
            var newMax = this._tempActor.mmp;

            if (newMax > currentMax) {
                this.changeTextColor(this.powerUpColor());
            } else if (newMax < currentMax) {
                this.changeTextColor(this.powerDownColor());
            } else {
                this.changeTextColor(this.normalColor());
            }

            this.drawText(newMax, 175, varY, 32, 'right');
        }
    }
};
    Window_EquipSlot.prototype.slotName = function(index) {
        return index === 0 ? "WEAPON" : "ACCESSORY";
    };

    Window_EquipSlot.prototype.drawItem = function(index) {
        if (this._actor) {
            const rect = this.itemRectForText(index);
            const item = this._actor.equips()[index];
            this.changePaintOpacity(this.isEnabled(index));
            
            this.contents.fillRect(rect.x, rect.y + rect.height - 2, rect.width, 1, this.normalColor());
            this.changeTextColor(this.systemColor());
            this.drawText(this.slotName(index), rect.x, rect.y, 85);
            
            if (item) {
                this.drawItemName(item, rect.x + 90, rect.y);
            } else {
                this.changeTextColor(this.textColor(7));
                this.drawText("-----", rect.x + 90, rect.y, rect.width - 90);
            }
            this.changePaintOpacity(true);
        }
    };

})();
