/*:
 * @plugindesc Hides the MP cost text in skill windows.
 * @author FALATRO
 * @help This plugin overrides the drawSkillCost function to display nothing.
 */

(function() {
    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        // Leave this function empty to hide MP and TP costs completely
    };
})();
