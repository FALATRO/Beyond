/*:
 * @plugindesc Final Fixed Frontview Enemy Hurt Sprite
 * @author FALATRO
 *
 * @help
 * Automatically swaps an enemy's sprite to an alternate "_hurt" file 
 * when they take damage, then cleanly restores the normal sprite.
 *
 * Requirements:
 * 1. Hurt sprites must end exactly with "_hurt" (e.g., Slime_hurt.png).
 * 2. Put both assets in your project's img/enemies/ folder.
 */

(() => {
    // 1. Give the underlying enemy object a true hurt status flag
    const _Game_Enemy_initMembers = Game_Enemy.prototype.initMembers;
    Game_Enemy.prototype.initMembers = function() {
        _Game_Enemy_initMembers.call(this);
        this._isHurtSpriteActive = false;
    };

    // 2. Intercept the core battlerName function.
    // If the hurt flag is active, we dynamically fake the name the engine looks for.
    const _Game_Enemy_battlerName = Game_Enemy.prototype.battlerName;
    Game_Enemy.prototype.battlerName = function() {
        const name = _Game_Enemy_battlerName.call(this);
        if (this._isHurtSpriteActive && !name.endsWith('_hurt')) {
            return name + '_hurt';
        }
        return name;
    };

    // 3. Trigger the hurt state when damage is taken
    const _Game_Enemy_performDamage = Game_Enemy.prototype.performDamage;
    Game_Enemy.prototype.performDamage = function() {
        _Game_Enemy_performDamage.call(this);
        
        // Only trigger if alive and not already displaying a hurt sprite
        if (!this.isDead() && !this._isHurtSpriteActive) {
            this._isHurtSpriteActive = true;

            // 4. Force a clean timeout to clear the flag after 350ms (roughly 20 frames)
            setTimeout(() => {
                this._isHurtSpriteActive = false;
            }, 350);
        }
    };
})();
