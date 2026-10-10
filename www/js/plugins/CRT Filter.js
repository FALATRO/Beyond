/*:
 * @plugindesc A quick plugin so I can apply my CRT filter
 * @author FALATRO
 */
(function() {
    var _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.call(this);
        
        var targetSwitchId = 5; 
        
        if ($gameSwitches && $gameSwitches.value(targetSwitchId)) {
            if (!this._crtSpriteOverlay) {
               
                this._crtSpriteOverlay = new Sprite(ImageManager.loadPicture('CRT'));
                this._crtSpriteOverlay.alpha = 0.7; // Faint, clean opacity
                this.addChild(this._crtSpriteOverlay);
            }
        } else {
  
            if (this._crtSpriteOverlay) {
                this.removeChild(this._crtSpriteOverlay);
                this._crtSpriteOverlay = null;
            }
        }
    };
})();
