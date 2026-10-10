//=============================================================================
// WindowBackImage.js
// ----------------------------------------------------------------------------
// (C)2017 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.5.1 2021/01/30 Battler status window was missing from the options, so it was added in.
// 1.5.0 2021/01/24 Possible to specify an individual window skin for each window.
// 1.4.0 2020/12/28 Add each window of JK_MailSystem.js as an option item.
// 1.3.1 2020/08/22 Added the ability to change the window background created by custom menu plugin.
// 1.3.0 2019/01/13 Added the ability to display multiple images in the window background.
//                  An ability for original window frame visible even when window background is specified.
// 1.2.0 2018/11/29 Added a switch to control whether window is enabled or not.
// 1.1.0 2017/11/19 Added the ability to set the magnification ratio.
// 1.0.0 2017/11/18 Public release
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc Replace windowskin with an image
 * @author triacontane
 *
 * @param windowImageInfo
 * @text window image information
 * @desc Information about window to be replace with an image.
 * @default
 * @type struct<WindowImages>[]
 *
 * @help WindowBackImage.js
 *
 * Replace the background of the window with any image.
 * Multiple images can be specified, and a switch can be specified for each.
 * You can choose whether to hide the original window frame when image is displayed.
 *
 * The background image will be displayed with the center as the origin, regardless of the window size.
 * It is possible to correct the magnification and coordinates,
 * but the size will be variable or indefinite window.
 *
 * Windows added by plugins can also be specified,
 * but this may not always work correctly.
 *
 * If you want to change background of the window added by SceneCustomMenu.js
 * Specify the WindowClass as the "Window Identifier" of the same plugin.
 *
 * There is no plugin command.
 */

/*~struct~WindowImages:
 *
 * @param WindowClass
 * @desc Window to be replaced with the specified image. If it's not listed, enter it directly.
 * @type select
 * @default
 * @option [General] Help window
 * @value Window_Help
 * @option [General] Gold window
 * @value Window_Gold
 * @option [Menu] Command window
 * @value Window_MenuCommand
 * @option [Menu] Status window
 * @value Window_MenuStatus
 * @option [Item] Category window
 * @value Window_ItemCategory
 * @option [Item] Item list window
 * @value Window_ItemList
 * @option [Item] Actor selection window
 * @value Window_MenuActor
 * @option [Skill] Type window
 * @value Window_SkillType
 * @option [Skill] Status window
 * @value Window_SkillStatus
 * @option [Skill] List window
 * @value Window_SkillList
 * @option [Equipment] Equip status window
 * @value Window_EquipStatus
 * @option [Equipment] Equip command window
 * @value Window_EquipCommand
 * @option [Equipment] Equip slot window
 * @value Window_EquipSlot
 * @option [Equipment] Equip item window
 * @value Window_EquipItem
 * @option [Status] Main status window
 * @value Window_Status
 * @option [Options] Option window
 * @value Window_Options
 * @option [Save/ Load] File list window
 * @value Window_SavefileList
 * @option [Shop] Shop command window
 * @value Window_ShopCommand
 * @option [Shop] Shop buy window
 * @value Window_ShopBuy
 * @option [Shop] Shop sell window
 * @value Window_ShopSell
 * @option [Shop] Shop number window
 * @value Window_ShopNumber
 * @option [Shop] Shop status window
 * @value Window_ShopStatus
 * @option [Name] Name edit window
 * @value Window_NameEdit
 * @option [Name] Name input window
 * @value Window_NameInput
 * @option [Map] Choice window
 * @value Window_ChoiceList
 * @option [Map] Number input window
 * @value Window_NumberInput
 * @option [Map] Item select window
 * @value Window_EventItem
 * @option [Map] Message window
 * @value Window_Message
 * @option [Map] Scroll text window
 * @value Window_ScrollText
 * @option [Map] Map name window
 * @value Window_MapName
 * @option [Battle] Battle log window
 * @value Window_BattleLog
 * @option [Battle] Party command window
 * @value Window_PartyCommand
 * @option [Battle] Actor command window
 * @value Window_ActorCommand
 * @option [Battle] Battle status window
 * @value Window_BattleStatus
 * @option [Battle] Actor list window
 * @value Window_BattleActor
 * @option [Battle] Enemy list window
 * @value Window_BattleEnemy
 * @option [Battle] Skill list window
 * @value Window_BattleSkill
 * @option [Battle] Item list window
 * @value Window_BattleItem
 * @option [Title] Title window
 * @value Window_TitleCommand
 * @option [Ending Game] Exit confirmation window
 * @value Window_GameEnd
 * @option [Debug] Variable selection window
 * @value Window_DebugRange
 * @option [Debug] Variable settings window
 * @value Window_DebugEdit
 * @option [Objective Plugin] Objectives window
 * @value Window_Destination
 * @option [Objective Plugin] Objective menu window
 * @value Window_DestinationMenu
 * @option [Ingame Time plugin] Time window
 * @value Window_Chronus
 * @option [Official Gacha Plugin] Gacha display window
 * @value Window_Gacha
 * @option [Official Gacha Plugin] Gacha command window
 * @value Window_GachaCommand
 * @option [Official Gacha Plugin] Gacha get command window
 * @value Window_GachaGetCommand
 * @option [Official Gacha Plugin] Gacha get window
 * @value Window_GachaGet
 * @option [Official Gacha Plugin] Cost window
 * @value Window_Cost
 * @option [Novel Game Plugin] Novel choice window
 * @value Window_NovelChoiceList
 * @option [Novel Game Plugin] Novel message window
 * @value Window_NovelMessage
 * @option [Novel Game Plugin] Novel title window
 * @value Window_NovelTitleCommand
 * @option [Novel Game Plugin] Novel number input window
 * @value Window_NovelNumberInput
 * @option [Novel Game Plugin] Pause menu window
 * @value Window_PauseMenu
 * @option [Cross Save Plugin] Password input window
 * @value Window_PasswordInput
 * @option [Cross Save Plugin] Password window
 * @value Window_PasswordEdit
 * @option [Glossary Plugin] Term category window
 * @value Window_GlossaryCategory
 * @option [Glossary Plugin] Term list window
 * @value Window_GlossaryList
 * @option [Glossary Plugin] Confirmation window
 * @value Window_GlossaryConfirm
 * @option [Glossary Plugin] Collection rate window
 * @value Window_GlossaryComplete
 * @option [Glossary Plugin] Glossary window
 * @value Window_Glossary
 * @option [Sound Test Plugin] Audio category window
 * @value Window_AudioCategory
 * @option [Sound Test Plugin] Audio list window
 * @value Window_AudioList
 * @option [Sound Test Plugin] Audio settings window
 * @value Window_AudioSetting
 * @option [Numeric Input Window Plugin] Numeric input window
 * @value Window_NumberInput
 * @option [Numeric Input Window Plugin] Numeric window
 * @value Window_NumberEdit
 * @option [JK_MailSystem] Mail list window
 * @value Window_MailList
 * @option [JK_MailSystem] Unread mail window
 * @value Window_Unread
 * @option [JK_MailSystem] Mail body window
 * @value Window_Mail
 * @option [JK_MailSystem] Attachment window
 * @value Window_MailAttachment
 * @option [JK_MailSystem] Mailbox command window
 * @value Window_MailBoxCommand
 *
 * @param ImageFile
 * @desc File name for image to be replaced. (Select from img/picture.) If empty, only the frame will be hidden.
 * @default
 * @require 1
 * @dir img/pictures/
 * @type file
 *
 * @param WindowSkin
 * @desc Uses windowskin.
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param OffsetX
 * @desc Value for the display X coordinate.
 * @default 0
 * @type number
 * @min -2000
 * @max 2000
 *
 * @param OffsetY
 * @desc Value for the display Y coordinate.
 * @default 0
 * @type number
 * @min -2000
 * @max 2000
 *
 * @param ScaleX
 * @desc Magnification ratio in X direction (specified in %).
 * @default 100
 * @type number
 * @min -2000
 * @max 2000
 *
 * @param ScaleY
 * @desc Magnification ratio in Y direction (specified in %).
 * @default 100
 * @type number
 * @min -2000
 * @max 2000
 *
 * @param WindowShow
 * @desc Uses background of original window even when an image is displayed.
 * @default false
 * @type boolean
 *
 * @param SwitchId
 * @desc Replaces the window only when the specified switch is ON.
 * @default 0
 * @type switch
 */

(function() {
    'use strict';

    var getClassName = function(object) {
        return object.constructor.toString().replace(/function\s+(.*)\s*\([\s\S]*/m, '$1');
    };

    //=============================================================================
    // ローカル関数
    //  プラグインパラメータやプラグインコマンドパラメータの整形やチェックをします
    //=============================================================================
    /**
     * Create plugin parameter. param[paramName] ex. param.commandPrefix
     * @param pluginName plugin name(EncounterSwitchConditions)
     * @returns {Object} Created parameter
     */
    var createPluginParameter = function(pluginName) {
        var paramReplacer = function(key, value) {
            if (value === 'null') {
                return value;
            }
            if (value[0] === '"' && value[value.length - 1] === '"') {
                return value;
            }
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        };
        var parameter     = JSON.parse(JSON.stringify(PluginManager.parameters(pluginName), paramReplacer));
        PluginManager.setParameters(pluginName, parameter);
        return parameter;
    };

    var param = createPluginParameter('WindowBackImage');
    if (!param.windowImageInfo) {
        param.windowImageInfo = [];
    }

    //=============================================================================
    // Window
    //  専用の背景画像を設定します。
    //=============================================================================
    var _Window__createAllParts      = Window.prototype._createAllParts;
    Window.prototype._createAllParts = function() {
        _Window__createAllParts.apply(this, arguments);
        this._backImageDataList = this.initBackImageData();
        if (this._backImageDataList.length >= 0) {
            this._createBackImage();
        }
    };

    Window.prototype._setBackImageProperty = function(backImageData) {
        this._backImageDx                   = parseInt(backImageData['OffsetX']) || 0;
        this._backImageDy                   = parseInt(backImageData['OffsetY']) || 0;
        this._windowBackImageSprite.scale.x = (parseInt(backImageData['ScaleX']) || 100) / 100;
        this._windowBackImageSprite.scale.y = (parseInt(backImageData['ScaleY']) || 100) / 100;
    };

    /**
     * 背景画像を作成します。
     * @private
     */
    Window.prototype._createBackImage = function() {
        this._windowBackSprite.visible  = false;
        this._windowFrameSprite.visible = false;
        this._windowBackImageSprites    = [];
        this._backImageDataList.forEach(function(backImageData) {
            var bitmap     = ImageManager.loadPicture(backImageData['ImageFile']);
            var sprite     = new Sprite_WindowBackImage(bitmap);
            sprite.scale.x = (backImageData['ScaleX'] || 100) / 100;
            sprite.scale.y = (backImageData['ScaleY'] || 100) / 100;
            this._windowBackImageSprites.push(sprite);
            this._windowSpriteContainer.addChild(sprite);
        }, this);
    };

    Window.prototype.initBackImageData = function() {
        var className = getClassName(this);
        // for SceneCustomMenu.js
        if (this._data && this._data.Id) {
            className = this._data.Id;
        }
        return param.windowImageInfo.filter(function(data) {
            return data['WindowClass'] === className;
        }, this);
    };

    Window.prototype.getBackImageDataItem = function(index, propName) {
        return this._backImageDataList[index][propName];
    };

    var _Window__refreshAllParts      = Window.prototype._refreshAllParts;
    Window.prototype._refreshAllParts = function() {
        if (this._windowBackImageSprites) {
            this._refreshBackImage();
        }
        _Window__refreshAllParts.apply(this, arguments);
    };

    /**
     * 背景画像をリフレッシュします。
     * @private
     */
    Window.prototype._refreshBackImage = function() {
        this._windowBackImageSprites.forEach(function(sprite, index) {
            sprite.x = this.width / 2 + this.getBackImageDataItem(index, 'OffsetX');
            sprite.y = this.height / 2 + this.getBackImageDataItem(index, 'OffsetY');
        }, this);
    };

    var _Window_update      = Window.prototype.update;
    Window.prototype.update = function() {
        _Window_update.apply(this, arguments);
        if (!this._windowBackImageSprites) {
            return;
        }
        var defaultVisible = true;
        this._windowBackImageSprites.forEach(function(sprite, index) {
            var switchId = this.getBackImageDataItem(index, 'SwitchId');
            sprite.visible = !switchId || $gameSwitches.value(switchId);
            if (sprite.visible && !this.getBackImageDataItem(index, 'WindowShow')) {
                defaultVisible = false;
            }
        }, this);
        this._windowBackSprite.visible  = defaultVisible;
        this._windowFrameSprite.visible = defaultVisible;
    };

    var _Window_Base_loadWindowskin = Window_Base.prototype.loadWindowskin;
    Window_Base.prototype.loadWindowskin = function() {
        _Window_Base_loadWindowskin.apply(this, arguments);
        var list = this._backImageDataList;
        if (list && list.length > 0 && list[0].WindowSkin) {
            this.windowskin = ImageManager.loadSystem(list[0].WindowSkin);
        }
    };

    var _Scene_Boot_isReady = Scene_Boot.prototype.isReady;
    Scene_Boot.prototype.isReady = function() {
        var ready = _Scene_Boot_isReady.apply(this, arguments);
        if (!ready) {
            return false;
        }
        if (!this._skins) {
            this.loadAllWindowSkin();
        }
        return this._skins.every(function(bitmap) {
            return bitmap.isReady();
        });
    };

    Scene_Boot.prototype.loadAllWindowSkin = function() {
        this._skins = param.windowImageInfo.filter(function(win) {
            return !!win.WindowSkin;
        }).map(function(win) {
            return ImageManager.loadSystem(win.WindowSkin);
        });
    };

    //=============================================================================
    // Sprite_WindowBackImage
    //  ウィンドウ背景画像のスプライトです。
    //=============================================================================
    function Sprite_WindowBackImage() {
        this.initialize.apply(this, arguments);
    }

    Sprite_WindowBackImage.prototype             = Object.create(Sprite.prototype);
    Sprite_WindowBackImage.prototype.constructor = Sprite_WindowBackImage;

    Sprite_WindowBackImage.prototype.initialize = function(bitmap) {
        Sprite.prototype.initialize.call(this);
        this.bitmap   = bitmap;
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
    };
})();

