
/* ------ Input ----- */

(function(modula){
    "use strict";

    /* Input.js gives you an object containing the mouse 
     * position as well as keypress status. 
     *
     * These value stay constant until you ask for an 
     * update. This is useful for frame based input.
     *
     * ex:
     *   var Input = require('./Input.js').Input;
     *   var input = new Input();
     *   ...
     *   input.update();             -> get new input frame
     *   input.isKeyDown('a');       -> true | false
     *   ...
     *   input.getMousePosition();   -> {x: 110, y: 220}
     */

    function Input(options) {
        options = options || {};
        var self = this;

        this._mouseStatus = 'out'; // 'out' | 'over' | 'entering' | 'leaving'
        this._mouseStatusPrevious = 'out';
        this._mouseStatusSystem = 'out';

        this._mousePosSystem    = {x:0, y:0};
        this._mousePos          = {x:0, y:0};
        this._mousePosPrevious  = {x:0, y:0};
        this._mousePosDelta     = {x:0, y:0};

        this._mouseDragPos      = {x:0, y:0};
        this._mouseDragDeltaPos = {x:0, y:0};
        this._mouseDrag = 'no'; // 'no' | 'dragging' | 'dragStart' | 'dragEnd'
        this._mouseEvents = [];

        this._keyStatus = {}; // 'up' | 'down' | 'press' | 'release' , undefined == 'up'
        this._keyUpdateTime = {};
        this._keyEvents = [];

        this._alias = {};
        this.setAlias({
            'mouse-left'  : 'mouse0',
            'mouse-middle': 'mouse1',
            'mouse-right' : 'mouse2',
        });
        this.setAlias(options.alias || {});

        
        this.node = options.node || document.querySelector(options.selector || 'body');
        
        this._onKeyup = function(e){
            self._keyEvents.push({type:'up', key: String.fromCharCode(e.which).toLowerCase()});
        };
        
        this._onKeydown = function(e){
            self._keyEvents.push({type:'down', key: String.fromCharCode(e.which).toLowerCase()});
        };

        this.node.addEventListener('keyup',  this._onKeyup);
        this.node.addEventListener('keydown',this._onKeydown);

        
        function relativeMouseCoords(domElement,event){
            var totalOffsetX = 0;
            var totalOffsetY = 0;
            
            do{
                totalOffsetX += domElement.offsetLeft;
                totalOffsetY += domElement.offsetTop;
            }while((domElement = domElement.offsetParent));
            
            return {
                x: event.pageX - totalOffsetX,
                y: event.pageY - totalOffsetY 
            };
        }

        function eventMousemove(event){
            self._mousePosSystem = relativeMouseCoords(this,event);
        }
        
        this.node.addEventListener('mousemove',eventMousemove,false);
        
        function eventMouseover(event){
            self._mouseStatusSystem = 'over';
        }
        
        this.node.addEventListener('mouseover',eventMouseover,false);

        function eventMouseout(event){
            self._mouseStatusSystem = 'out';
        }
        this.node.addEventListener('mouseout',eventMouseout,false);
        
        function eventMousedown(event){
            self._keyEvents.push({type:'down', key:'mouse'+event.button});

        }
        this.node.addEventListener('mousedown',eventMousedown,false);

        function eventMouseup(event){
            self._keyEvents.push({type:'up', key:'mouse'+event.button});
        }
        this.node.addEventListener('mouseup',eventMouseup,false);
        
    };

    modula.Input = Input;

    var proto = Input.prototype;

    proto.update = function() {
        var time = (new Date()).getTime();
        
        for(var i = 0; i < this._keyEvents.length; i++){
            var e =  this._keyEvents[i];
            var previous = this._keyStatus[e.key];
            if(e.type === 'up'){
                if(previous === 'down' || previous === 'press'){
                    this._keyStatus[e.key] = 'release';
                }else{
                    this._keyStatus[e.key] = 'up';
                }
            }else if(e.type === 'down'){
                if(previous !== 'down'){
                    this._keyStatus[e.key] = 'press';
                }
                if(previous === 'press'){
                    this._keyStatus[e.key] = 'down';
                }
            }
            this._keyUpdateTime[e.key] = time;
        }
        for(var key in this._keyStatus){
            if(this._keyUpdateTime[key] === undefined || this._keyUpdateTime[key] < time ){
                var status = this._keyStatus[key];
                if(status === 'press'){
                    this._keyStatus[key] = 'down';
                }else if(status === 'release'){
                    this._keyStatus[key] = 'up';
                }
                this._keyUpdateTime[key] = time;
            }
        }
        this._keyEvents = [];

        this._mousePosPrevious = this._mousePos || {x:0, y:0};
        this._mousePos = this._mousePosSystem ||   {x:0, y:0};
        this._mousePosDelta = { x: this._mousePos.x - this._mousePosPrevious.x,
                                y: this._mousePos.y - this._mousePosPrevious.y };
        
        this._mouseStatusPrevious = this._mouseStatus;
        if(this._mouseStatusSystem === 'over'){
            if(this._mouseStatus === 'out' || this._mouseStatus === 'leaving'){
                this._mouseStatus = 'entering';
            }else{ // over || entering
                this._mouseStatus = 'over';
            }
        }else{ //out
            if(this._mouseStatus === 'over' || this._mouseStatus === 'entering'){
                this._mouseStatus = 'leaving';
            }else{  // leaving || out
                this._mouseStatus = 'out';
            }
        }
    };

    /* key: a,b,c,...,y,z,1,2,..0,!,    _,$,...,
     * 'left','right','up','down','space',
     * 'alt','shift','left-shift','right-shift','ctrl','super',
     * 'f1','f2','enter','esc','insert','delete','home','end',
     * 'pageup','pagedown'
     * 'mouseX','mouse-left','mouse-right','mouse-middle','scroll-up','scroll-down'
     */

    // return true the first frame of a key being pressed
    proto.isKeyPressing = function(key){
        key = this.getAlias(key);
        return this._keyStatus[key] === 'press';
    };

    // return true the first frame of a key being depressed
    proto.isKeyReleasing = function(key){
        key = this.getAlias(key);
        return this._keyStatus[key] === 'release';
    };

    // return true as long as a key is pressed
    proto.isKeyDown = function(key){
        key = this.getAlias(key);
        var s = this._keyStatus[key];
        return s === 'down' || s === 'press';
    };

    // return true as long as a key is depressed. equivalent to !isKeyDown() 
    proto.isKeyUp = function(key){
        key = this.getAlias(key);
        var s = this._keyStatus[key];
        return s === undefined || s === 'up' || s === 'release';
    };

    // return true if the mouse is over the canvas
    proto.isMouseOver = function(){
        return this._mouseStatus === 'over' || this._mouseStatus === 'entering';
    };

    // return true the first frame the mouse is over the canvas
    proto.isMouseEntering = function(){
        return this._mouseStatus === 'entering';
    };

    // return true the first frame the mouse is outside the canvas
    proto.isMouseLeaving = function(){
        return this._mouseStatus === 'leaving';
    };

    // return -1 if scrolling down, 1 if scrolling up, 0 if not scrolling
    proto.getMouseScroll = function(){
        if ( this.isKeyDown('scroll-up')){
            return 1;
        }else if (this.isKeyDown('scroll-down')){
            return -1;
        }
        return 0;
    };

    // returns the mouse position over the canvas in pixels
    proto.getMousePosition = function(){
        return this._mousePos || {x:0, y:0};
    };

    proto.setAlias = function(action,key){
        if(typeof action === 'object'){
            var aliases = action;
            for(var act in aliases){
                this.setAlias(act,aliases[act]);
            }
        }
        this._alias[action] = key;
    };

    proto.getAlias = function(alias){
        while(alias in this._alias){
            alias = this._alias[alias];
        }
        return alias;
    };
    
})(typeof exports === 'undefined' ? ( this['modula'] || (this['modula'] = {})) : exports );

