
/* ------ Main Loop ----- */

(function(modula){
    "use strict";

    /* Loop.js gives you a main loop for your interactive
     * application, with controlled time, etc.
     * 
     *   var Loop = require('./Loop.js').Loop;
     *   var main = new Loop({fps:60}, function(main){
     *      console.log(main.frame);
     *      ...
     *   });
     *   ...
     *   main.start();
     */

    function Loop(options, update) {
        if (typeof options === 'function') {
            this._update = options;
            options = {};
        } else {
            options = options || {};
            this._update  = update || function(){};
        }
        this.running = false;
        this.frame = 0;
        this.time  = 0;
        this.timeSystem = 0;
        this.startTime  = 0;
        this.fps    = options.fps || 60;
        this.deltaTimeExpected  = 1 / this.fps
        this.deltaTime          = 1 / this.fps;
        this.loadFactor = 0;
    }

    modula.Loop = Loop;

    var proto = Loop.prototype;

    proto.setFps = function(fps) {
        this.fps = fps;
        this.deltaTime = 1 / fps;
        this.deltaTimeSystem = 1 / fps;
    }

    proto.stop = function() {
        this.running = false;
    };

    proto.now   = function() {
        return (new Date()).getTime() * 0.001;
    };

    proto._runFrame = function() {
        var time = this.now();
        this.deltaTime  = time - this.timeSystem;
        this.timeSystem = time;
        this.time = this.timeSystem - this.startTime;
        this._update(this);
        this.frame += 1;
    };

    proto.start = function() {
        var self = this;
        if(this.running){
            return;
        }
        this.running = true;

        var time = this.now();
        this.running = true;
        this.startTime = time;
        this.time = 0;
        this.timeSystem = this.startTime;
        this.frame = 0;

        function loop(){
            if (!self.running) {
                return;
            }

            self._runFrame();
            var elapsedTime = self.now() - self.timeSystem;
            var waitTime = self.deltaTimeExpected - elapsedTime;
            self.loadFactor = elapsedTime / self.deltaTimeExpected;
            setTimeout(loop,(self.deltaTimeExpected - elapsedTime) * 1000);
        }

        loop();
    };

})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

