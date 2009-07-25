function MainAssistant() {
}

MainAssistant.prototype.setup = function() {
    // sub menu, to select host
    this.controller.setupWidget(Mojo.Menu.viewMenu,
        this.attributes = {
            spacerHeight : 0,
            menuClass    : 'no-fade'
        },
        this.model = {
            visible : true,
            items : [ { width : 320, submenu : 'host-picker', label : 'pacifico' } ]
        }
    );

    this.controller.setupWidget('host-picker', undefined,
        this.model = {
            label : 'Select Frontend',
            items : [
                {label : 'pacifico', command : 'pacifico'},
                {label : 'martini', command : 'martini'}
            ]
        }
    );

    // myth response hash
    this.mythtvResponse = new Hash();

    // timeout to update status
    this.wakeFunction = this.checkStatus.bind(this);
    this.wakeId = this.controller.window.setTimeout(this.wakeFunction, 1000);

    // select button
    this.selectButtonAttributes = {};
    this.selectButtonModel = {
        buttonLabel : 'Select',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('selectButton', this.selectButtonAttributes, this.selectButtonModel);
    Mojo.Event.listen(this.controller.get('selectButton'), Mojo.Event.tap, this.handleSelectButtonPress.bind(this));

    // up button
    this.upButtonAttributes = {};
    this.upButtonModel = {
        buttonLabel : '↑',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('upButton', this.upButtonAttributes, this.upButtonModel);
    Mojo.Event.listen(this.controller.get('upButton'), Mojo.Event.tap, this.handleUpButtonPress.bind(this));

    // down button
    this.downButtonAttributes = {};
    this.downButtonModel = {
        buttonLabel : '↓',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('downButton', this.downButtonAttributes, this.downButtonModel);
    Mojo.Event.listen(this.controller.get('downButton'), Mojo.Event.tap, this.handleDownButtonPress.bind(this));

    // left button
    this.leftButtonAttributes = {};
    this.leftButtonModel = {
        buttonLabel : '←',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('leftButton', this.leftButtonAttributes, this.leftButtonModel);
    Mojo.Event.listen(this.controller.get('leftButton'), Mojo.Event.tap, this.handleLeftButtonPress.bind(this));

    // right button
    this.rightButtonAttributes = {};
    this.rightButtonModel = {
        buttonLabel : '→',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('rightButton', this.rightButtonAttributes, this.rightButtonModel);
    Mojo.Event.listen(this.controller.get('rightButton'), Mojo.Event.tap, this.handleRightButtonPress.bind(this));

    // esc button
    this.escButtonAttributes = {};
    this.escButtonModel = {
        buttonLabel : '<',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('escButton', this.escButtonAttributes, this.escButtonModel);
    Mojo.Event.listen(this.controller.get('escButton'), Mojo.Event.tap, this.handleESCButtonPress.bind(this));

    // menu button
    this.menuButtonAttributes = {};
    this.menuButtonModel = {
        buttonLabel : 'M',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('menuButton', this.menuButtonAttributes, this.menuButtonModel);
    Mojo.Event.listen(this.controller.get('menuButton'), Mojo.Event.tap, this.handleMenuButtonPress.bind(this));

    // pause button
    this.pauseButtonAttributes = {};
    this.pauseButtonModel = {
        buttonLabel : '||',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('pauseButton', this.pauseButtonAttributes, this.pauseButtonModel);
    Mojo.Event.listen(this.controller.get('pauseButton'), Mojo.Event.tap, this.handlePauseButtonPress.bind(this));

    // info button
    this.infoButtonAttributes = {};
    this.infoButtonModel = {
        buttonLabel : 'I',
        buttonClass : '',
        disabled    : false
    };
    this.controller.setupWidget('infoButton', this.infoButtonAttributes, this.infoButtonModel);
    Mojo.Event.listen(this.controller.get('infoButton'), Mojo.Event.tap, this.handleInfoButtonPress.bind(this));
}


MainAssistant.prototype.activate = function(event) {
}


MainAssistant.prototype.deactivate = function(event) {
}

MainAssistant.prototype.cleanup = function(event) {
}

/****** callbacks *******/
MainAssistant.prototype.handleCommand = function(event) {
    if (event.type != Mojo.Event.command)
        return;

    Mojo.Log.info('host switched to', event.command);
}

MainAssistant.prototype.handleSelectButtonPress = function(event) {
    this.sendToMyth('key enter');
}
MainAssistant.prototype.handleUpButtonPress = function(event) {
    this.sendToMyth('key up');
}
MainAssistant.prototype.handleDownButtonPress = function(event) {
    this.sendToMyth('key down');
}
MainAssistant.prototype.handleLeftButtonPress = function(event) {
    this.sendToMyth('key left');
}
MainAssistant.prototype.handleRightButtonPress = function(event) {
    this.sendToMyth('key right');
}
MainAssistant.prototype.handleESCButtonPress = function(event) {
    this.sendToMyth('key escape');
}
MainAssistant.prototype.handleMenuButtonPress = function(event) {
    this.sendToMyth('key m');
}
MainAssistant.prototype.handlePauseButtonPress = function(event) {
    this.sendToMyth('key p');
}
MainAssistant.prototype.handleInfoButtonPress = function(event) {
    this.sendToMyth('key i');
}

/* update status */
MainAssistant.prototype.checkStatus = function() {
    this.mythtvCommand = 'query location';
    this.mythtvResponse.set(this.mythtvCommand, "STATUS");
    this.sendToMyth(this.mythtvCommand);

    this.wakeId = setTimeout(this.wakeFunction, 5000);
}

/******* move to model? *********************/

/* uses Remote Control Port.. enable on each frontend via:
 * Setup -> General -> Page 4 :
 *    [x] Enable Network Remote Control Interface */
MainAssistant.prototype.sendToMyth = function(cmd) {
    new Ajax.Request("http://192.168.3.4:6546", {
           method       : 'POST',
           evalJSON     : false,
           evalJS       : false,
           sanitizeJSON : false,
           postBody     : cmd + "\nexit\n",
           onComplete   : this.handleCommandResponse.bind(this)
        });

    // unless this is "query location", schedule the next
    // status update right away
    if (cmd != "query location") {
        this.controller.window.clearTimeout(this.wakeId);
        this.wakeId = setTimeout(this.wakeFunction, 500);
    }
}

MainAssistant.prototype.handleCommandResponse = function(response) {
    Mojo.Log.info("got command response: ", response.responseText);

    /* strip off the errors, as we send http header before command */
    /* TODO HOW TO SEND RAW TEXT TO A SOCKET???? */
    var invalid = new RegExp("^# INVALID command ");
    var pastheader = false;
    var pastinvalid = false;
    var thisResp = "Error";

    var respArr = response.responseText.split("\n");

    for (var i = 0; i < respArr.length; i++) {
        if (pastinvalid) {
            thisResp += respArr[i].sub(/^# /, '');
            thisResp.sub(/^ # /, '');
        } else if (pastheader) {
            if (!invalid.test(respArr[i])) {
                pastinvalid = true;
                thisResp = respArr[i].sub(/^# /, '');
            }
        } else {
            if (invalid.test(respArr[i])) {
                pastheader = true;
            }
        }
    }

    if (this.mythtvResponse.get(this.mythtvCommand) == "STATUS")
        this.controller.get('response').update(thisResp);

    this.mythtvResponse.set(this.mythtvCommand, thisResp);
}
