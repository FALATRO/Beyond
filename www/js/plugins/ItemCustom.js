/*:
 * @plugindesc Custom Item Menu with Food/Important tabs, widened actor HP display, and Q/W switching.
 * @author YourName
 * 
 * @help
 * 1. Name this file exactly: ItemCustom.js
 * 2. Place background images in img/pictures/ matching actor IDs:
 *    - ItemMenu_Bg_Actor1.png  (For Database Actor ID 001)
 */

(function() {

    // =========================================================================
    // 1. REWRITE THE CATEGORIES
    // =========================================================================
    
    Window_ItemCategory.prototype.makeCommandList = function() {
        this.addCommand("Food", 'item');
        this.addCommand("Important", 'keyItem');
    };

    Window_ItemCategory.prototype.maxCols = function() {
        return 2;
    };


    // =========================================================================
    // 2. THE SCENE SETUP & DYNAMIC PORTRAIT BACKGROUNDS
    // =========================================================================

    const _Scene_Item_initialize = Scene_Item.prototype.initialize;
    Scene_Item.prototype.initialize = function() {
        _Scene_Item_initialize.call(this);
        $gameParty.members().forEach(function(actor) {
            ImageManager.loadPicture('ItemMenu_Bg_Actor' + actor.actorId());
        });
    };

    Scene_Item.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);

        this._customBg = new Sprite();
        this._customBg.x = (Graphics.boxWidth - 550) / 2;
        this._customBg.y = 126;
        this.addChild(this._customBg);
        
        this.updateItemBoxGraphic();
    };

    Scene_Item.prototype.updateItemBoxGraphic = function() {
        if (this._customBg) {
            var activeActor = $gameParty.menuActor();
            if (activeActor) {
                this._customBg.bitmap = ImageManager.loadPicture('ItemMenu_Bg_Actor' + activeActor.actorId());
            }
        }
    };


    // =========================================================================
    // 3. CREATE CUSTOM PROFILE WINDOW AND EVENT HANDLERS
    // =========================================================================

    function Window_CustomItemStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_CustomItemStatus.prototype = Object.create(Window_Base.prototype);
    Window_CustomItemStatus.prototype.constructor = Window_CustomItemStatus;

    Window_CustomItemStatus.prototype.initialize = function(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };

    Window_CustomItemStatus.prototype.refresh = function() {
        this.contents.clear();
        var actor = $gameParty.menuActor();
        if (actor) {
            this.resetFontSettings();
            
            this.changeTextColor(this.normalColor());
            this.drawText(actor.name(), 5, 0, this.width - 10, 'left');
            
            var hpLabel = TextManager.hpA || "HP"; 
            this.changeTextColor(this.systemColor());
            this.drawText(hpLabel, 5, 55, 60);
            
            this.changeTextColor(this.normalColor());
            var hpText = actor.hp + " / " + actor.mhp;
            this.drawText(hpText, 70, 55, 170, 'right'); 
        }
    };

    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function() {
        _Scene_Item_create.call(this);
        this.createCustomActorStatusWindow();
        this.bindActorSwitchingHandlers();
    };

    Scene_Item.prototype.createCustomActorStatusWindow = function() {
        var baseBoxX = (Graphics.boxWidth - 550) / 2;
        this._customStatusWindow = new Window_CustomItemStatus(baseBoxX + 15, 126 + 80, 260, 195);
        this._customStatusWindow.opacity = 0; 
        this.addWindow(this._customStatusWindow);
    };

    Scene_Item.prototype.bindActorSwitchingHandlers = function() {
        this._categoryWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._categoryWindow.setHandler('pageup',   this.previousActor.bind(this));
        this._itemWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._itemWindow.setHandler('pageup',   this.previousActor.bind(this));
    };

    Scene_Item.prototype.nextActor = function() {
        $gameParty.makeMenuActorNext();
        this.onActorChange();
    };

    Scene_Item.prototype.previousActor = function() {
        $gameParty.makeMenuActorPrevious();
        this.onActorChange();
    };

    Scene_Item.prototype.onActorChange = function() {
        this.updateItemBoxGraphic();
        this._customStatusWindow.refresh();
        this._itemWindow.refresh();
        
        if (this._categoryWindow.active) {
            this._categoryWindow.activate();
        } else {
            this._itemWindow.activate();
        }
    };


    // =========================================================================
    // 4. WINDOW REPOSITION COORD RE-MAPPING
    // =========================================================================
    
    const _Scene_Item_createHelpWindow = Scene_Item.prototype.createHelpWindow;
    Scene_Item.prototype.createHelpWindow = function() {
        _Scene_Item_createHelpWindow.call(this);
        var baseBoxX = (Graphics.boxWidth - 550) / 2;
        this._helpWindow.x = baseBoxX + 15;
        this._helpWindow.y = 126 + 10;
        this._helpWindow.width = 520;
        this._helpWindow.height = 65;
        this._helpWindow.opacity = 0; 
    };

    const _Scene_Item_createCategoryWindow = Scene_Item.prototype.createCategoryWindow;
    Scene_Item.prototype.createCategoryWindow = function() {
        _Scene_Item_createCategoryWindow.call(this);
        var baseBoxX = (Graphics.boxWidth - 550) / 2;
        this._categoryWindow.x = baseBoxX + 285; 
        this._categoryWindow.y = 126 + 80;
        this._categoryWindow.width = 235;       
        this._categoryWindow.opacity = 0; 
    };

    const _Scene_Item_createItemWindow = Scene_Item.prototype.createItemWindow;
    Scene_Item.prototype.createItemWindow = function() {
        _Scene_Item_createItemWindow.call(this);
        var baseBoxX = (Graphics.boxWidth - 550) / 2;
        this._itemWindow.x = baseBoxX + 285; 
        this._itemWindow.y = 126 + 135;      
        this._itemWindow.width = 235;       
        this._itemWindow.height = 140;      
        this._itemWindow.opacity = 0;
    };

    Window_ItemList.prototype.maxCols = function() {
        return 1;
    };


    // =========================================================================
    // 5. DIRECT ITEM USAGE & IMMEDIATE HP REFRESH
    // =========================================================================

    // Override: Bypass the window that makes you pick an actor
    Scene_Item.prototype.determineItem = function() {
        var action = new Game_Action(this.user());
        var item = this.item();
        action.setItemObject(item);
        
        // If it targets a party member, check if it actually does anything first
        if (action.isForFriend()) {
            var targets = this.itemTargetActors();
            var canApply = targets.some(function(target) {
                return action.testApply(target);
            });
            
            // If the target is already at max HP (for example), play a buzzer.
            // Otherwise, use the item directly on the current actor.
            if (canApply) {
                this.useItem();
            } else {
                SoundManager.playBuzzer();
            }
            this.activateItemWindow();
        } else {
            // For non-ally items (like common events that don't target)
            this.useItem();
            this.activateItemWindow();
        }
    };

    // Override: Force the item's target to be the active character shown in your custom window
    Scene_Item.prototype.itemTargetActors = function() {
        var action = new Game_Action(this.user());
        action.setItemObject(this.item());
        if (!action.isForFriend()) {
            return [];
        } else if (action.isForAll()) {
            return $gameParty.members(); // "All Allies" items still heal the whole party
        } else {
            return [$gameParty.menuActor()]; // Targets the current page's actor directly
        }
    };

    // Alias: Refresh the HP text and Item quantities the instant the item is consumed
    const _Scene_Item_useItem = Scene_Item.prototype.useItem;
    Scene_Item.prototype.useItem = function() {
        _Scene_Item_useItem.call(this);
        
        // Refresh your custom HP window directly
        if (this._customStatusWindow) {
            this._customStatusWindow.refresh();
        }
        
        // Refresh the item selection window so the item count (e.g. x4 -> x3) updates
        if (this._itemWindow) {
            this._itemWindow.refresh();
        }
    };

})();