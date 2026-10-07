/*:
 * @plugindesc Enables video parallax backgrounds for RPG Maker MV maps.
 * Use the notetag <videoParallax: filename> in map settings or
 * use the plugin command PLAY_PARALLAX filename to set the video.
 * @author Psychronic Games
 *
 * @help
 * Place your MP4 video files in the 'movies' folder of your project.
 * Use the notetag <videoParallax: filename> in map settings to specify the video.
 * Example: <videoParallax: Cyberspace-02>
 *
 * Plugin Commands:
 * PLAY_PARALLAX filename - Play a specific video parallax
 * STOP_PARALLAX - Stop the currently playing video parallax
 */

(function() {
    var _Spriteset_Map_createParallax = Spriteset_Map.prototype.createParallax;
    var _Scene_Map_terminate = Scene_Map.prototype.terminate;

    Spriteset_Map.prototype.createParallax = function() {
        _Spriteset_Map_createParallax.call(this);
        this.createVideoParallax();
    };

Spriteset_Map.prototype.createVideoParallax = function(filename) {
    var note = $dataMap.note;
    var match = note.match(/<videoParallax:\s*(.*?)(?:,\s*upsideDown)?\s*>/i);
    if (!filename && match) {
        filename = match[1].trim();
    }

    if (!filename) return; // Exit if no filename is found

    var upsideDown = note.includes(", upsideDown");
    if (this._videoParallax) {
        this._parallax.removeChild(this._videoParallax);
    }

    this._videoParallax = this.createVideoSprite(filename, upsideDown);

    // Add the video parallax to the parallax layer
    this._parallax.addChild(this._videoParallax);
};

    Spriteset_Map.prototype.createVideoSprite = function(filename, upsideDown) {
        var path = 'movies/' + filename + '.mp4';
        var video = document.createElement('video');
        video.src = path;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;

        var texture = PIXI.Texture.from(video);
        var sprite = new PIXI.Sprite(texture);
        sprite.width = Graphics.width;
        sprite.height = Graphics.height;

        if (upsideDown) {
            sprite.scale.y = -1;
            sprite.anchor.y = 1;
        }

        var updateVideoTexture = function() {
            if (video.readyState >= 2) {
                texture.update();
            }
            requestAnimationFrame(updateVideoTexture);
        };

        updateVideoTexture();

        sprite._pauseVideo = function() {
            if (!video.paused) {
                video.pause();
            }
        };
		
	 sprite._stopAndHideVideo = function() {
        if (!video.paused) {
            video.pause();
        }
        video.src = ""; // Clear the video source
        video.load();   // Load the empty source to reset the video element
        this.visible = false; // Hide the sprite
        if (this.parent) {
            this.parent.removeChild(this);
        }
    };

        sprite._playVideo = function() {
            if (video.paused) {
                video.play();
            }
        };

        window.addEventListener('blur', sprite._pauseVideo);
        window.addEventListener('focus', sprite._playVideo);

        return sprite;
    };

Scene_Map.prototype.terminate = function() {
    if (this._spriteset && this._spriteset._videoParallax) {
        var videoSprite = this._spriteset._videoParallax;
        videoSprite._stopAndHideVideo();
    }
    _Scene_Map_terminate.call(this);
};

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);

        if (SceneManager._scene instanceof Scene_Map) {
            var spriteset = SceneManager._scene._spriteset;
            if (spriteset) {
                switch (command.toUpperCase()) {
                    case 'PLAY_PARALLAX':
                        var filename = args.join(" "); // Join arguments to form the filename
                        spriteset.createVideoParallax(filename);
                        break;
                    case 'STOP_PARALLAX':
                        if (spriteset._videoParallax) {
                            spriteset._videoParallax._stopAndHideVideo();
                        }
                        break;
                }
            }
        }
    };
})();
