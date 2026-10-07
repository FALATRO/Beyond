//=============================================================================
// Fullscreen.js
//=============================================================================

/*:
 * @plugindesc Starts the game in fullscreen
 * @author Christian Schicho
 *
 * @help
 * This plugin automatically starts the game in fullscreen mode.
 */

;(function() {
  // Helper function to extend existing methods with new functionality
  function extend(obj, name, func) {
    // Store the original method
    const orig = obj.prototype[name];
    // Replace the original method with a new one that calls both
    obj.prototype[name] = function() {
      orig.call(this); // Call the original method
      func.call(this); // Call the new functionality
    };
  }

  // Extend the Scene_Boot's start method to switch to fullscreen
  extend(Scene_Boot, 'start', function() {
    // Ensure Graphics object is available and call its fullscreen switch method
    if (Graphics && Graphics._switchFullScreen) {
      Graphics._switchFullScreen();
    }
  });
})();