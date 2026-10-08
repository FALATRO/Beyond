//=============================================================================
// main.js
//=============================================================================
// Override DataManager to read from window.$dataBundled instead of making XHR requests
var _DataManager_loadDataFile = DataManager.loadDataFile;
DataManager.loadDataFile = function(name, src) {
    if (window.$dataBundled && window.$dataBundled[src]) {
        // Load directly from memory bundle (Bypasses CORS entirely)
        window[name] = window.$dataBundled[src];
        this.onLoad(window[name]);
    } else {
        // Fallback to standard XHR if a file isn't in the bundle
        _DataManager_loadDataFile.call(this, name, src);
    }
};

PluginManager.setup($plugins);

window.onload = function() {
    SceneManager.run(Scene_Boot);
};
