/*:
 * @plugindesc OMORI-style Skill Menu & 6-Slot Equip System (100% Free & Standalone)
 * @author FALATRO
 * 
 * @help 
 * 1. MUST BE NAMED EXACTLY: SkillCustom.js
 * 2. Does NOT require any paid plugins!
 * 3. Place background images in img/pictures/ matching actor IDs:
 *    - SkillBox_Actor1.png  (For Database Actor ID 001)
 */

(function() {

    // =========================================================================
    // 1. DATA CORE: 6-SLOT EQUIPPED SKILL SYSTEM
    // =========================================================================

    var _Game_Actor_setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        _Game_Actor_setup.call(this, actorId);
        this.initEquippedSkills();
    };

    Game_Actor.prototype.initEquippedSkills = function() {
        if (!this._equippedSkills) {
            this._equippedSkills = [0, 0, 0, 0, 0, 0]; // 6 slots (0 = empty)
            // Auto-equip the first 6 learned skills by default
            var learned = this.learnedSkills();
            for (var i = 0; i < Math.min(learned.length, 6); i++) {
                if (learned[i]) this._equippedSkills[i] = learned[i].id;
            }
        }
    };

    // Returns array of learned skill objects (all skills known by actor)
    var _Game_Actor_skills = Game_Actor.prototype.skills;
    Game_Actor.prototype.learnedSkills = function() {
        return _Game_Actor_skills.call(this);
    };

    // Returns array of 6 equipped skill objects (or null for empty slots)
    Game_Actor.prototype.equippedSkills = function() {
        if (!this._equippedSkills) this.initEquippedSkills();
        return this._equippedSkills.map(function(id) {
            return id > 0 ? $dataSkills[id] : null;
        });
    };

    // Override default skills() so ONLY equipped skills are available in battle
    Game_Actor.prototype.skills = function() {
        if ($gameParty.inBattle()) {
            return this.equippedSkills().filter(function(skill) {
                return skill !== null;
            });
        }
        return this.learnedSkills();
    };

    Game_Actor.prototype.equipSkill = function(slotIndex, skillId) {
        if (!this._equippedSkills) this.initEquippedSkills();
        
        // If skill is already equipped in another slot, clear that slot first
        var existingIndex = this._equippedSkills.indexOf(skillId);
        if (existingIndex !== -1) {
            this._equippedSkills[existingIndex] = 0;
        }
        
        this._equippedSkills[slotIndex] = skillId;
    };

    Game_Actor.prototype.unequipSkill = function(slotIndex) {
        if (!this._equippedSkills) this.initEquippedSkills();
        this._equippedSkills[slotIndex] = 0;
    };


    // =========================================================================
    // 2. CUSTOM WINDOW: 6 EQUIPPED SLOTS (Window_SkillEquip)
    // =========================================================================

    function Window_SkillEquip() {
        this.initialize.apply(this, arguments);
    }
    Window_SkillEquip.prototype = Object.create(Window_Selectable.prototype);
    Window_SkillEquip.prototype.constructor = Window_SkillEquip;

    Window_SkillEquip.prototype.initialize = function(x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this._actor = null;
    };

    Window_SkillEquip.prototype.setActor = function(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    };

    Window_SkillEquip.prototype.maxCols = function() { return 2; };
    Window_SkillEquip.prototype.maxItems = function() { return 6; };

    Window_SkillEquip.prototype.item = function() {
        return this._actor ? this._actor.equippedSkills()[this.index()] : null;
    };

    Window_SkillEquip.prototype.drawItem = function(index) {
        var rect = this.itemRectForText(index);
        var skill = this._actor ? this._actor.equippedSkills()[index] : null;
        if (skill) {
            this.drawItemName(skill, rect.x, rect.y, rect.width);
        } else {
            this.changePaintOpacity(false);
            this.drawText("-----", rect.x, rect.y, rect.width, 'center');
            this.changePaintOpacity(true);
        }
    };

    Window_SkillEquip.prototype.updateHelp = function() {
        this.setHelpWindowItem(this.item());
    };


    // =========================================================================
    // 3. OVERRIDE KNOWN SKILL LIST (Show all learned skills, bypass categories)
    // =========================================================================

    Window_SkillList.prototype.includes = function(item) {
        return item !== null; // Show all learned skills without needing skill-type buttons
    };

    Window_SkillList.prototype.makeItemList = function() {
        if (this._actor) {
            this._data = this._actor.learnedSkills().filter(function(item) {
                return this.includes(item);
            }, this);
        } else {
            this._data = [];
        }
    };

    Window_SkillList.prototype.isEnabled = function(item) {
        return true; // All learned skills can be selected to equip
    };


    // =========================================================================
    // 4. SCENE SKILL OVERRIDE & BACKGROUND LOADING
    // =========================================================================

    const _Scene_Skill_initialize = Scene_Skill.prototype.initialize;
    Scene_Skill.prototype.initialize = function() {
        _Scene_Skill_initialize.call(this);
        $gameParty.members().forEach(function(actor) {
            ImageManager.loadPicture('SkillBox_Actor' + actor.actorId());
        });
    };

    Scene_Skill.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite();
        this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
        this.addChild(this._backgroundSprite);

        this._customBg = new Sprite();
        this._customBg.x = (Graphics.boxWidth - 550) / 2; // Center horizontally
        this._customBg.y = 126;
        this.addChild(this._customBg); 
        
        var initialActor = $gameParty.menuActor();
        if (initialActor) {
            this._customBg.bitmap = ImageManager.loadPicture('SkillBox_Actor' + initialActor.actorId());
        }
    };

    Scene_Skill.prototype.updateSkillBoxGraphic = function() {
        if (this._customBg && this._actor) {
            this._customBg.bitmap = ImageManager.loadPicture('SkillBox_Actor' + this._actor.actorId());
        }
    };

    Scene_Skill.prototype.create = function() {
        Scene_ItemBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createStatusWindow();
        this.createEquipSkillWindow(); 
        this.createItemWindow();       
        
        this.refreshActor();
        
        if (this._skillEquipWindow) {
            this._skillEquipWindow.activate();
            this._skillEquipWindow.select(0);
        }
    };

    // --- INTERACTION LOGIC ---

    Scene_Skill.prototype.onEquipOk = function() {
        this._itemWindow.activate();
        this._itemWindow.select(0);
    };

    Scene_Skill.prototype.onItemOk = function() {
        var skill = this._itemWindow.item();
        var slotId = this._skillEquipWindow.index();
        var currentSlotSkill = this.actor().equippedSkills()[slotId];
        
        SoundManager.playEquip();

        // If clicking the skill already in this slot, unequip it
        if (skill && currentSlotSkill && skill.id === currentSlotSkill.id) {
            this.actor().unequipSkill(slotId);
        } else if (skill) {
            this.actor().equipSkill(slotId, skill.id);
        }
        
        this._skillEquipWindow.refresh();
        this._itemWindow.refresh();
        this._statusWindow.refresh();
        
        this._itemWindow.deselect();
        this._skillEquipWindow.activate();
    };

    Scene_Skill.prototype.onItemCancel = function() {
        this._itemWindow.deselect();
        this._skillEquipWindow.activate();
    };

    Scene_Skill.prototype.popScene = function() {
        Scene_MenuBase.prototype.popScene.call(this);
    };


    // =========================================================================
    // 5. WINDOW LAYOUT POSITIONS & STATUS DISPLAY
    // =========================================================================

    // Top Bar Description Box
    Scene_Skill.prototype.createHelpWindow = function() {
        this._helpWindow = new Window_Help(2);
        this._helpWindow.x = (Graphics.boxWidth - 550) / 2 + 15;        
        this._helpWindow.y = 126 + 10;       
        this._helpWindow.width = 520;
        this._helpWindow.height = 65;
        this._helpWindow.opacity = 0; 
        this.addWindow(this._helpWindow);
    };

    // Left Column Profile (Name & HP only - Luck removed)
    Scene_Skill.prototype.createStatusWindow = function() {
        var startX = (Graphics.boxWidth - 550) / 2;
        this._statusWindow = new Window_SkillStatus(startX + 15, 126 + 80);
        this._statusWindow.width = 220;
        this._statusWindow.height = 185;
        this._statusWindow.opacity = 0;
        this.addWindow(this._statusWindow);
    };

    Window_SkillStatus.prototype.refresh = function() {
        this.contents.clear();
        if (this._actor) {
            this.changeTextColor(this.normalColor());
            this.drawText(this._actor.name(), 5, 0, this.width - 10, 'left');
            
        }
    };

    // Right Column Upper Half: 6 Equipped Skill Slots
    Scene_Skill.prototype.createEquipSkillWindow = function() {
        var startX = (Graphics.boxWidth - 550) / 2;
        this._skillEquipWindow = new Window_SkillEquip(startX + 245, 126 + 80, 275, 144);
        this._skillEquipWindow.setHelpWindow(this._helpWindow);
        this._skillEquipWindow.setHandler('ok',     this.onEquipOk.bind(this));
        this._skillEquipWindow.setHandler('cancel', this.popScene.bind(this));
        this._skillEquipWindow.setHandler('pagedown', this.nextActor.bind(this));
        this._skillEquipWindow.setHandler('pageup',   this.previousActor.bind(this));
        this._skillEquipWindow.opacity = 0;
        this.addWindow(this._skillEquipWindow);
    };

    // Right Column Lower Half: Learned Skills Library List
    Scene_Skill.prototype.createItemWindow = function() {
        var startX = (Graphics.boxWidth - 550) / 2;
        this._itemWindow = new Window_SkillList(startX + 245, 126 + 225, 275, 100);
        this._itemWindow.setHelpWindow(this._helpWindow);
        this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
        this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
        this._itemWindow.opacity = 0;
        this.addWindow(this._itemWindow);
    };

    Scene_Skill.prototype.refreshActor = function() {
        var actor = this.actor();
        this._statusWindow.setActor(actor);
        if (this._skillEquipWindow) this._skillEquipWindow.setActor(actor);
        this._itemWindow.setActor(actor);
    };

    Scene_Skill.prototype.onActorChange = function() {
        this.refreshActor();
        this.updateSkillBoxGraphic();
        if (this._skillEquipWindow) {
            this._skillEquipWindow.activate();
            this._skillEquipWindow.select(0);
        }
    };

})();