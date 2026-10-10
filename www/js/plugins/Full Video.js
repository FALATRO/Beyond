/*:
 * @plugindesc Forces game videos to stretch and completely fill the screen layout.
 * @author AI Help
 */
(function() {
    var _Graphics_playVideo = Graphics.playVideo;
    Graphics.playVideo = function(src) {
        _Graphics_playVideo.call(this, src);
        if (this._video) {
            this._video.style.width = '100%';
            this._video.style.height = '100%';
            this._video.style.objectFit = 'fill';
        }
    };
})();
