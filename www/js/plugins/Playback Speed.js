/*:
 * @plugindesc v16.1 - Playback Speed battle system with Per-Actor Action TP Generation & Rewind Penalty.
 * @author
 *
 * @help
 * ============================================================================
 * PLAYBACK SPEED
 * ============================================================================
 *
 * Replaces Guard with Speed.
 *
 * NORMAL SPEED
 * - No special effect.
 * - Costs 0 Time Points.
 *
 * FAST FORWARD
 * - Costs 2 Time Points when the action is actually committed.
 * - All actor skills cost 50% MP for the current turn.
 *
 * REWIND
 * - Costs 2 Time Points when the action is actually committed.
 * - Restores actor HP to their battle-start values.
 * - Restores party inventory to their battle-start values.
 * - REDUCES the user's Max HP and Max MP by 25% for the rest of the battle.
 *   (Stacks with multiple uses).
 *
 * PAUSE
 * - Costs 2 Time Points when the action is actually committed.
 * - Enemies cannot act for the current turn.
 * - Enemies are displayed in grayscale for the current turn.
 * - Actor critical chance against enemies is increased by 50%.
 *
 * TIME POINTS (ACTION-DRIVEN)
 * - Battle-only currency.
 * - Starts at 0.
 * - Maximum 4.
 * - Each actor tracks their own actions taken.
 * - Every 2 actions used by an actor grants +1 TP to the party.
 *
 * CURRENT SPEED DISPLAY
 * - The Speed command displays the active speed after it is used.
 * - The active speed remains displayed for the rest of the turn.
 * - At the beginning of the next turn it returns to Normal.
 *
 * INPUT ISOLATION
 * - Window_ActorCommand does not update while the Speed window is active.
 *
 * CHARGE TURN COMPATIBILITY
 * - BattleManager.isRbsFastForward()
 * - BattleManager.rbsShouldSkipCharge()
 * ============================================================================
 */
(function() {
    'use strict';

    var RBS = {};

    RBS.MODES = {
        NORMAL: 'normal',
        FAST: 'fast',
        REWIND: 'rewind',
        PAUSE: 'pause'
    };

    RBS.STARTING_TIME_POINTS = 4;
    RBS.MAX_TIME_POINTS = 4;
    RBS.TIME_POINTS_PER_GAIN = 1;
    RBS.ACTIONS_PER_TP = 2; // Every 2 actions taken by an actor awards 1 TP
    RBS.MODE_COST = 2;
    RBS.PAUSE_CRIT_BONUS = 999;
    RBS.FAST_MP_MULTIPLIER = 0.50;
    RBS.REWIND_STAT_PENALTY = 0.25; // 25% Max HP/MP reduction per use


    // =========================================================================
    // ITEM KEY FUNCTIONS
    // =========================================================================

    RBS.itemKey = function(item) {
        if (DataManager.isItem(item)) {
            return 'i' + item.id;
        }

        if (DataManager.isWeapon(item)) {
            return 'w' + item.id;
        }

        if (DataManager.isArmor(item)) {
            return 'a' + item.id;
        }

        return null;
    };


    RBS.dataItemFromKey = function(key) {
        if (!key || key.length < 2) {
            return null;
        }

        var type = key.charAt(0);
        var id = Number(key.substring(1));

        if (!id) {
            return null;
        }

        if (type === 'i') {
            return $dataItems[id];
        }

        if (type === 'w') {
            return $dataWeapons[id];
        }

        if (type === 'a') {
            return $dataArmors[id];
        }

        return null;
    };


    // =========================================================================
    // BATTLE STATE SNAPSHOT
    // =========================================================================

    RBS.snapshotBattleState = function() {
        var snapshot = {
            actors: {},
            items: {}
        };

        $gameParty.battleMembers().forEach(function(actor) {
            snapshot.actors[actor.actorId()] = {
                hp: actor.hp
            };
        });

        $gameParty.allItems().forEach(function(item) {
            var key = RBS.itemKey(item);

            if (key) {
                snapshot.items[key] = $gameParty.numItems(item);
            }
        });

        return snapshot;
    };


    RBS.restoreBattleState = function(snapshot) {
        if (!snapshot) {
            return;
        }

        $gameParty.battleMembers().forEach(function(actor) {
            var saved = snapshot.actors[actor.actorId()];

            if (saved) {
                actor.setHp(saved.hp);

                if (saved.hp > 0) {
                    actor.removeState(actor.deathStateId());
                }
            }
        });

        $gameParty.allItems().slice().forEach(function(item) {
            var key = RBS.itemKey(item);

            if (!key) {
                return;
            }

            var target = snapshot.items[key] || 0;
            var current = $gameParty.numItems(item);

            if (current !== target) {
                $gameParty.gainItem(item, target - current, false);
            }
        });

        Object.keys(snapshot.items).forEach(function(key) {
            var item = RBS.dataItemFromKey(key);

            if (!item) {
                return;
            }

            var target = snapshot.items[key];
            var current = $gameParty.numItems(item);

            if (current !== target) {
                $gameParty.gainItem(item, target - current, false);
            }
        });
    };


    // =========================================================================
    // ACTOR SPEED MODE & ACTION TRACKING
    // =========================================================================

    Game_Actor.prototype.rbsSelectedMode = function() {
        return this._rbsSelectedMode || RBS.MODES.NORMAL;
    };


    Game_Actor.prototype.rbsPendingMode = function() {
        return this._rbsPendingMode || this.rbsSelectedMode();
    };


    Game_Actor.prototype.rbsSetSelectedMode = function(mode) {
        this._rbsSelectedMode = mode || RBS.MODES.NORMAL;
    };


    Game_Actor.prototype.rbsSetPendingMode = function(mode) {
        this._rbsPendingMode = mode || RBS.MODES.NORMAL;
        this._rbsSelectedMode = this._rbsPendingMode;
    };


    Game_Actor.prototype.rbsClearPendingMode = function() {
        this._rbsPendingMode = null;
    };


    Game_Actor.prototype.rbsResetSpeedMode = function() {
        this._rbsPendingMode = null;
        this._rbsSelectedMode = RBS.MODES.NORMAL;
    };


    Game_Actor.prototype.rbsResetActionCount = function() {
        this._rbsActionCount = 0;
    };


    Game_Actor.prototype.rbsRegisterAction = function() {
        this._rbsActionCount = (this._rbsActionCount || 0) + 1;

        if (this._rbsActionCount >= RBS.ACTIONS_PER_TP) {
            this._rbsActionCount = 0;
            BattleManager.rbsGainTimePoints(RBS.TIME_POINTS_PER_GAIN);
        }
    };


    // =========================================================================
    // REWIND STAT PENALTIES
    // =========================================================================

    Game_Actor.prototype.rbsAddRewindPenalty = function() {
        this._rbsRewindStacks = (this._rbsRewindStacks || 0) + 1;
        this.refresh(); // Automatically clamps current HP/MP to the newly reduced maximums
    };


    Game_Actor.prototype.rbsClearRewindPenalty = function() {
        this._rbsRewindStacks = 0;
        this.refresh();
    };


    var _Game_Actor_paramRate = Game_Actor.prototype.paramRate;

    Game_Actor.prototype.paramRate = function(paramId) {
        var rate = _Game_Actor_paramRate.call(this, paramId);
        
        // paramId 0 = MHP (Max HP), paramId 1 = MMP (Max MP)
        if ((paramId === 0 || paramId === 1) && this._rbsRewindStacks) {
            var reduction = this._rbsRewindStacks * RBS.REWIND_STAT_PENALTY;
            // Floor at 1% of base stats to prevent engine divide-by-zero or insta-death loops
            var penaltyRate = Math.max(0.01, 1.0 - reduction); 
            rate *= penaltyRate;
        }
        
        return rate;
    };


    // =========================================================================
    // TIME POINT FUNCTIONS
    // =========================================================================

    BattleManager.rbsTimePoints = function() {
        return this._rbsTimePoints || 0;
    };


    BattleManager.rbsMaxTimePoints = function() {
        return RBS.MAX_TIME_POINTS;
    };


    BattleManager.rbsModeCost = function(mode) {
        return mode === RBS.MODES.NORMAL ? 0 : RBS.MODE_COST;
    };


    BattleManager.rbsCanAffordMode = function(mode) {
        return this.rbsTimePoints() >= this.rbsModeCost(mode);
    };


    BattleManager.rbsSpendTimePoints = function(amount) {
        amount = Math.max(0, Number(amount) || 0);

        if (this.rbsTimePoints() < amount) {
            return false;
        }

        this._rbsTimePoints = this.rbsTimePoints() - amount;
        return true;
    };


    BattleManager.rbsGainTimePoints = function(amount) {
        amount = Math.max(0, Number(amount) || 0);

        this._rbsTimePoints = Math.min(
            RBS.MAX_TIME_POINTS,
            this.rbsTimePoints() + amount
        );
    };


    BattleManager.getTimePoints = function() {
        return this.rbsTimePoints();
    };


    BattleManager.getMaxTimePoints = function() {
        return this.rbsMaxTimePoints();
    };


    // =========================================================================
    // CURRENT SPEED MODE
    // =========================================================================

    BattleManager.rbsCurrentMode = function() {
        return this._rbsTurnMode || RBS.MODES.NORMAL;
    };


    BattleManager.rbsCurrentSpeedName = function() {
        switch (this.rbsCurrentMode()) {
            case RBS.MODES.FAST:
                return 'Fast';
            case RBS.MODES.REWIND:
                return 'Rewind';
            case RBS.MODES.PAUSE:
                return 'Pause';
            default:
                return 'Normal';
        }
    };


    BattleManager.rbsIsNormalSpeed = function() {
        return this.rbsCurrentMode() === RBS.MODES.NORMAL;
    };


    BattleManager.isRbsFastForward = function() {
        return !!this._rbsFastForward;
    };


    BattleManager.isRbsPause = function() {
        return !!this._rbsPause;
    };


    BattleManager.rbsShouldSkipCharge = function() {
        return this.isRbsFastForward();
    };


    BattleManager.isRbsChargeFastForward = function() {
        return this.isRbsFastForward();
    };


    BattleManager.rbsActivateMode = function(mode) {
        mode = mode || RBS.MODES.NORMAL;

        if (mode === RBS.MODES.NORMAL) {
            return;
        }

        this._rbsTurnMode = mode;
        this._rbsFastForward = (mode === RBS.MODES.FAST);
        this._rbsPause = (mode === RBS.MODES.PAUSE);

        if (mode === RBS.MODES.REWIND) {
            RBS.restoreBattleState(this._rbsSnapshot);
            return;
        }

        if (mode === RBS.MODES.PAUSE) {
            if ($gameTroop && $gameTroop.members) {
                $gameTroop.members().forEach(function(enemy) {
                    enemy.clearActions();
                });
            }
        }
    };


    BattleManager.rbsEndActualTurn = function() {
        this._rbsTurnMode = RBS.MODES.NORMAL;
        this._rbsFastForward = false;
        this._rbsPause = false;

        if ($gameParty && $gameParty.members) {
            $gameParty.members().forEach(function(actor) {
                actor.rbsResetSpeedMode();
            });
        }
    };


    // =========================================================================
    // BATTLE START / END
    // =========================================================================

    var _BattleManager_startBattle = BattleManager.startBattle;

    BattleManager.startBattle = function() {
        this._rbsBattleActive = true;
        this._rbsTimePoints = RBS.STARTING_TIME_POINTS;
        this._rbsTurnMode = RBS.MODES.NORMAL;
        this._rbsFastForward = false;
        this._rbsPause = false;
        this._rbsSnapshot = RBS.snapshotBattleState();

        if ($gameParty && $gameParty.members) {
            $gameParty.members().forEach(function(actor) {
                actor.rbsResetSpeedMode();
                actor.rbsResetActionCount();
                actor.rbsClearRewindPenalty();
            });
        }

        _BattleManager_startBattle.call(this);
    };


    var _BattleManager_endBattle = BattleManager.endBattle;

    BattleManager.endBattle = function(result) {
        _BattleManager_endBattle.call(this, result);

        this._rbsBattleActive = false;
        this._rbsTimePoints = 0;
        this._rbsTurnMode = RBS.MODES.NORMAL;
        this._rbsFastForward = false;
        this._rbsPause = false;
        this._rbsSnapshot = null;

        if ($gameParty && $gameParty.members) {
            $gameParty.members().forEach(function(actor) {
                actor.rbsResetSpeedMode();
                actor.rbsResetActionCount();
                actor.rbsClearRewindPenalty();
            });
        }
    };


    // =========================================================================
    // ACTION COMPLETION HOOKS
    // =========================================================================

    var _BattleManager_endAction = BattleManager.endAction;

    BattleManager.endAction = function() {
        var subject = this._subject;

        _BattleManager_endAction.call(this);

        if (this._rbsBattleActive) {
            if (subject && subject.isActor && subject.isActor()) {
                subject.rbsRegisterAction();
            }

            this.rbsEndActualTurn();
        }
    };


    // =========================================================================
    // ACTOR COMMAND WINDOW
    // =========================================================================

    Window_ActorCommand.prototype.addGuardCommand = function() {
        var mode = BattleManager.rbsCurrentMode();

        if (
            mode === RBS.MODES.NORMAL &&
            this._actor &&
            this._actor.rbsSelectedMode
        ) {
            mode = this._actor.rbsSelectedMode();
        }

        var name = 'Speed: Normal';

        if (mode === RBS.MODES.FAST) {
            name = 'Speed: Fast';
        }

        if (mode === RBS.MODES.REWIND) {
            name = 'Speed: Rewind';
        }

        if (mode === RBS.MODES.PAUSE) {
            name = 'Speed: Pause';
        }

        this.addCommand(name, 'rbsSpeed', true);
    };


    // =========================================================================
    // INPUT ISOLATION
    // =========================================================================

    var _Window_ActorCommand_update = Window_ActorCommand.prototype.update;

    Window_ActorCommand.prototype.update = function() {
        var scene = SceneManager._scene;

        if (
            scene &&
            scene._rbsSpeedWindow &&
            scene._rbsSpeedWindow.active
        ) {
            return;
        }

        if (scene && scene._rbsSpeedInputBlock) {
            return;
        }

        _Window_ActorCommand_update.call(this);
    };


    // =========================================================================
    // SPEED WINDOW
    // =========================================================================

    function Window_RBSMode() {
        this.initialize.apply(this, arguments);
    }

    Window_RBSMode.prototype = Object.create(Window_Command.prototype);
    Window_RBSMode.prototype.constructor = Window_RBSMode;

    Window_RBSMode.prototype.initialize = function(x, y) {
        Window_Command.prototype.initialize.call(this, x, y);
        this._selectedMode = RBS.MODES.NORMAL;
        this.openness = 0;
    };

    Window_RBSMode.prototype.windowWidth = function() {
        return 300;
    };

    Window_RBSMode.prototype.numVisibleRows = function() {
        return 4;
    };

    Window_RBSMode.prototype.makeCommandList = function() {
        this.addCommand('Normal Speed', RBS.MODES.NORMAL, true);
        this.addCommand('Fast Forward', RBS.MODES.FAST, true);
        this.addCommand('Rewind', RBS.MODES.REWIND, true);
        this.addCommand('Pause', RBS.MODES.PAUSE, true);
    };

    Window_RBSMode.prototype.isCommandEnabled = function(index) {
        var enabled = Window_Command.prototype.isCommandEnabled.call(this, index);

        if (!enabled) {
            return false;
        }

        var mode = this.commandSymbol(index);

        if (mode === RBS.MODES.NORMAL) {
            return true;
        }

        return BattleManager.rbsCanAffordMode(mode);
    };

    Window_RBSMode.prototype.setSelectedMode = function(mode) {
        this._selectedMode = mode || RBS.MODES.NORMAL;
        this.refresh();
    };

    Window_RBSMode.prototype.drawItem = function(index) {
        var rect = this.itemRectForText(index);
        var symbol = this.commandSymbol(index);
        var text = this.commandName(index);

        if (symbol === this._selectedMode) {
            text = '✓ ' + text;
        }

        if (symbol !== RBS.MODES.NORMAL) {
            text += ' (' + RBS.MODE_COST + ' TP)';
        }

        this.resetTextColor();

        if (!this.isCommandEnabled(index)) {
            this.changePaintOpacity(false);
        }

        this.drawText(text, rect.x, rect.y, rect.width, 'left');
        this.changePaintOpacity(true);
    };


    // =========================================================================
    // SCENE BATTLE
    // =========================================================================

    var _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;

    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);

        this._actorCommandWindow.setHandler(
            'rbsSpeed',
            this.commandRbsSpeed.bind(this)
        );

        this.createRbsSpeedWindow();
    };


    Scene_Battle.prototype.createRbsSpeedWindow = function() {
        var width = 300;
        var height = 36 * 4 + 18;
        var x = Math.floor((Graphics.boxWidth - width) / 2);
        var y = Math.floor((Graphics.boxHeight - height) / 2);

        this._rbsSpeedInputBlock = false;
        this._rbsSpeedWindow = new Window_RBSMode(x, y);
        this._rbsSpeedWindow.hide();
        this._rbsSpeedWindow.deactivate();
        this._rbsSpeedWindow.close();

        this._rbsSpeedWindow.setHandler(RBS.MODES.NORMAL, this.onRbsSpeedOk.bind(this));
        this._rbsSpeedWindow.setHandler(RBS.MODES.FAST, this.onRbsSpeedOk.bind(this));
        this._rbsSpeedWindow.setHandler(RBS.MODES.REWIND, this.onRbsSpeedOk.bind(this));
        this._rbsSpeedWindow.setHandler(RBS.MODES.PAUSE, this.onRbsSpeedOk.bind(this));
        this._rbsSpeedWindow.setHandler('cancel', this.onRbsSpeedCancel.bind(this));

        this.addWindow(this._rbsSpeedWindow);
    };


    Scene_Battle.prototype.commandRbsSpeed = function() {
        var actor = BattleManager.actor();

        if (!actor) {
            return;
        }

        this._actorCommandWindow.deactivate();
        this._actorCommandWindow.hide();

        var currentMode = BattleManager.rbsCurrentMode();

        if (currentMode === RBS.MODES.NORMAL) {
            currentMode = actor.rbsSelectedMode();
        }

        this._rbsSpeedWindow.setSelectedMode(currentMode);
        this._rbsSpeedWindow.selectSymbol(currentMode);
        this._rbsSpeedWindow.refresh();
        this._rbsSpeedWindow.show();
        this._rbsSpeedWindow.open();
        this._rbsSpeedWindow.activate();
    };


    Scene_Battle.prototype.onRbsSpeedOk = function() {
        var actor = BattleManager.actor();

        if (!actor) {
            return;
        }

        var mode = this._rbsSpeedWindow.currentSymbol();

        if (!BattleManager.rbsCanAffordMode(mode)) {
            SoundManager.playBuzzer();
            this._rbsSpeedWindow.activate();
            return;
        }

        actor.rbsSetPendingMode(mode);
        actor.rbsSetSelectedMode(mode);
        this._rbsSpeedWindow.setSelectedMode(mode);

        this.finishRbsSpeedWindow();
    };


    Scene_Battle.prototype.onRbsSpeedCancel = function() {
        this.finishRbsSpeedWindow();
    };


    Scene_Battle.prototype.finishRbsSpeedWindow = function() {
        this._rbsSpeedWindow.deactivate();
        this._rbsSpeedWindow.close();
        this._rbsSpeedWindow.hide();

        this._rbsSpeedInputBlock = true;
        this._actorCommandWindow.deactivate();
        this._actorCommandWindow.hide();
    };


    var _Scene_Battle_update = Scene_Battle.prototype.update;

    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);

        if (!this._rbsSpeedInputBlock) {
            return;
        }

        this._actorCommandWindow.deactivate();
        this._actorCommandWindow.hide();

        var released =
            !Input.isPressed('ok') &&
            !Input.isPressed('cancel') &&
            !Input.isPressed('up') &&
            !Input.isPressed('down') &&
            !Input.isPressed('left') &&
            !Input.isPressed('right');

        if (!released) {
            return;
        }

        this._rbsSpeedInputBlock = false;
        this._actorCommandWindow.show();
        this._actorCommandWindow.activate();
    };


    // =========================================================================
    // ACTION COMMIT / TIME POINT COST / REWIND PENALTY APPLICATION
    // =========================================================================

    var _Scene_Battle_selectNextCommand = Scene_Battle.prototype.selectNextCommand;

    Scene_Battle.prototype.selectNextCommand = function() {
        var actor = BattleManager.actor();
        var action = BattleManager.inputtingAction();

        if (actor && action && action.item()) {
            var mode = actor.rbsPendingMode();
            var cost = BattleManager.rbsModeCost(mode);

            if (cost > 0) {
                if (!BattleManager.rbsSpendTimePoints(cost)) {
                    mode = RBS.MODES.NORMAL;
                }
            }

            if (mode !== RBS.MODES.NORMAL) {
                // Apply the penalty dynamically right when Rewind commits
                if (mode === RBS.MODES.REWIND) {
                    actor.rbsAddRewindPenalty(); 
                }
                BattleManager.rbsActivateMode(mode);
            }

            actor.rbsClearPendingMode();

            if (this._actorCommandWindow) {
                this._actorCommandWindow.refresh();
            }
        }

        _Scene_Battle_selectNextCommand.call(this);
    };


    // =========================================================================
    // FAST FORWARD
    // =========================================================================

    RBS.isFastForwardForActor = function(actor) {
        if (!actor) {
            return false;
        }

        if (BattleManager.isRbsFastForward()) {
            return true;
        }

        if (actor.rbsPendingMode && actor.rbsPendingMode() === RBS.MODES.FAST) {
            return true;
        }

        return false;
    };


    var _Game_BattlerBase_skillMpCost = Game_BattlerBase.prototype.skillMpCost;

    Game_BattlerBase.prototype.skillMpCost = function(skill) {
        var value = _Game_BattlerBase_skillMpCost.call(this, skill);

        if (
            this.isActor &&
            this.isActor() &&
            RBS.isFastForwardForActor(this)
        ) {
            value = Math.floor(value * RBS.FAST_MP_MULTIPLIER);
        }

        return value;
    };


    // =========================================================================
    // PAUSE CRITICAL CHANCE
    // =========================================================================

    var _Game_Action_itemCri = Game_Action.prototype.itemCri;

    Game_Action.prototype.itemCri = function(target) {
        var rate = _Game_Action_itemCri.call(this, target);
        var subject = this.subject();

        if (
            BattleManager.isRbsPause() &&
            subject &&
            subject.isActor() &&
            target &&
            target.isEnemy()
        ) {
            rate *= (1.0 + RBS.PAUSE_CRIT_BONUS);
            rate = Math.min(1.0, rate);
        }

        return rate;
    };


    // =========================================================================
    // PAUSE ACTION ORDER
    // =========================================================================

    var _BattleManager_makeActionOrders = BattleManager.makeActionOrders;

    BattleManager.makeActionOrders = function() {
        _BattleManager_makeActionOrders.call(this);

        if (!this.isRbsPause() || !this._actionBattlers) {
            return;
        }

        this._actionBattlers = this._actionBattlers.filter(function(battler) {
            return !battler.isEnemy();
        });
    };


    var _Game_Enemy_makeActions = Game_Enemy.prototype.makeActions;

    Game_Enemy.prototype.makeActions = function() {
        if (BattleManager.isRbsPause()) {
            this.clearActions();
            return;
        }

        _Game_Enemy_makeActions.call(this);
    };


    // =========================================================================
    // PAUSE NEXT SUBJECT
    // =========================================================================

    var _BattleManager_getNextSubject = BattleManager.getNextSubject;

    BattleManager.getNextSubject = function() {
        var subject = _BattleManager_getNextSubject.call(this);

        if (this.isRbsPause() && subject && subject.isEnemy()) {
            subject.clearActions();
            return this.getNextSubject();
        }

        return subject;
    };


    // =========================================================================
    // PAUSE START ACTION
    // =========================================================================

    var _BattleManager_startAction = BattleManager.startAction;

    BattleManager.startAction = function() {
        if (
            this.isRbsPause() &&
            this._subject &&
            this._subject.isEnemy()
        ) {
            this._subject.clearActions();
            return;
        }

        _BattleManager_startAction.apply(this, arguments);
    };


    // =========================================================================
    // PAUSE DAMAGE PREVENTION
    // =========================================================================

    var _Game_Action_apply = Game_Action.prototype.apply;

    Game_Action.prototype.apply = function(target) {
        var subject = this.subject();

        if (
            BattleManager.isRbsPause() &&
            subject &&
            subject.isEnemy()
        ) {
            if (target && target.result) {
                target.result().clear();
            }
            return;
        }

        _Game_Action_apply.apply(this, arguments);
    };


    // =========================================================================
    // PAUSE GRAYSCALE
    // =========================================================================

    var _Sprite_Enemy_update = Sprite_Enemy.prototype.update;

    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);
        this.rbsUpdateGrayscale();
    };


    Sprite_Enemy.prototype.rbsUpdateGrayscale = function() {
        var shouldBeGray = BattleManager.isRbsPause();

        if (shouldBeGray && !this._rbsGrayApplied) {
            if (this.getColorTone && this.setColorTone) {
                this._rbsOriginalColorTone = this.getColorTone().slice();
                this.setColorTone([0, 0, 0, 255]);
                this._rbsGrayApplied = true;
            }
            return;
        }

        if (!shouldBeGray && this._rbsGrayApplied) {
            if (this.setColorTone) {
                this.setColorTone(this._rbsOriginalColorTone || [0, 0, 0, 0]);
            }
            this._rbsOriginalColorTone = null;
            this._rbsGrayApplied = false;
        }
    };

})();