/*:
 * @plugindesc Allows for skills to not be selectable if you do not have enough energy.
 * @author FALATRO
 * @help 
 */

(function() {
    var _Scene_Battle_onSkillOk = Scene_Battle.prototype.onSkillOk;
    Scene_Battle.prototype.onSkillOk = function() {
        var skill = this._skillWindow.item();
        var actor = BattleManager.actor();
        if (actor && skill && !actor.meetsSkillConditions(skill)) {
            SoundManager.playBuzzer(); 
            this._skillWindow.activate(); 
            return;
        }

        _Scene_Battle_onSkillOk.call(this);
    };
})();
