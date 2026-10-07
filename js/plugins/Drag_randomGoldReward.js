//=============================================================================
// Drag_randomGoldReward.js
// by Drag ==> discord : Drag#3796
//=============================================================================

/*:
 * @plugindesc This plugin allow to set up a random amount of gold dropped by each enemies (between a min and max value);
 * @author Drag
 * @version 1.0.0
 *
 * @help To setup a random amount of gold for an enemy, put the following notetag into your enemy note inside the database : 
 * <randomGold: min-max>
 *
 * Example :
 * <randomGold: 50-100>
 *
 * Here, the enemy will drop a random amount of gold between 50 & 100.
*/

(function() {
	Game_Troop.prototype.goldTotal = function() {
		return this.deadMembers().reduce(function(r, enemy) {
			let meta = $dataEnemies[enemy._enemyId].meta;
			let gold = 0;
            if (meta.randomGold) {
				let max = parseInt(meta.randomGold.split("-")[1]);
				let min = parseInt(meta.randomGold.split("-")[0]);
				gold = Math.floor(Math.random() * (max - min + 1)) + min;
            } else {
				gold = enemy.gold();
			}
			return r + gold;
		}, 0) * this.goldRate();
	};
})();