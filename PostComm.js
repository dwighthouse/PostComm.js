// PostComm.js
// https://github.com/dwighthouse/PostComm.js
// 
// Under MIT License
// Copyright (c) 2013 Dwight House
// 
// Colossians 3:23-24

/*jslint white: true */
(function(window) {
    'use strict';

    ////////////////////////////////////////////////////////////
    // Local Variables
    ////////////////////////////////////////////////////////////
    var addEvent,
        removeEvent,
        uniqueWindowId,
        pingMessagePrefix = 'postComm_ping_',
        pingMessageRegex = new RegExp('^' + pingMessagePrefix + '-?\\d+$', ''),
        postCommNamespace = window.postComm,
        commStore = {},
        api = {};

    // Structure of commStore:
    // {
    //     origin1: [
    //         {
    //             comm1,   // associated with origin1 and contentWindow1
    //             details1 // associated with comm1
    //         },
    //         {
    //             comm2,   // associated with origin1 and contentWindow2
    //             details2 // associated with comm2
    //         },
    //         ...
    //     ],
    //     origin2: [
    //         {
    //             comm3,   // associated with origin2 and contentWindow3
    //             details3 // associated with comm3
    //         },
    //         ...
    //     ],
    //     ...
    // }


    ////////////////////////////////////////////////////////////
    // Utilities
    ////////////////////////////////////////////////////////////

    // http://javascriptrules.com/2009/07/22/cross-browser-event-listener-with-design-patterns/
    addEvent = (function () {
        if (window.addEventListener) {
            return function (el, ev, fn) {
                el.addEventListener(ev, fn, false);
            };
        }

        if (window.attachEvent) {
            return function (el, ev, fn) {
                el.attachEvent('on' + ev, fn);
            };
        }

        return function (el, ev, fn) {
            el['on' + ev] = fn;
        };
    }());

    // http://javascriptrules.com/2009/07/22/cross-browser-event-listener-with-design-patterns/
    removeEvent = (function () {
        if (window.removeEventListener) {
            return function (el, ev, fn) {
                el.removeEventListener(ev, fn, false);
            };
        }

        if (window.detachEvent) {
            return function (el, ev, fn) {
                el.detachEvent('on' + ev, fn);
            };
        }

        return function (el, ev) {
            el['on' + ev] = [].u; // undefined
        };
    }());

    // http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
    // http://jsperf.com/hashing-strings/20
    function hashString(string) {
        var hash = 0,
            index,
            length = string.length;

        for (index = 0; index < length; index += 1)
        {
            hash = hash * 31 + string.charCodeAt(index);
            hash = Math.floor(hash);
        }

        return hash;
    }

    function find(array, callback) {
        var index,
            length = array.length,
            value;

        for (index = 0; index < length; index += 1)
        {
            value = array[index];

            if (callback(value, index))
            {
                return value;
            }
        }

        // Not found, returns undefined
    }

    function timeNow() {
        return +(new Date()); // Coerse date into milliseconds since epoch
    }

    function maybeMakeProperty(object, key, defaultValue) {
        // If the key already exists, there is no effect, as the value of an object's unassigned key is undefined
        object[key] = object.hasOwnProperty(key) ? object[key] : defaultValue;
    }

    function isValidOrigin(origin) {
        return (/^https?:\/\//).test(origin);
    }

    function isValidContentWindow(contentWindow) {
        return !!contentWindow && !!contentWindow.window && contentWindow === contentWindow.window;
    }

    // Do nothing, return undefined
    function noop() { return; }

    function convertUrlToOrigin(url) {
        var start = url.indexOf('//') + 2,
            thirdSlashIndex = url.indexOf('/', start); // Safe: indexOf with start out of bounds === -1

        if (thirdSlashIndex !== -1)
        {
            return url.substr(0, thirdSlashIndex);
        }

        return url;
    }


    ////////////////////////////////////////////////////////////
    // Make unique identifier for this window
    ////////////////////////////////////////////////////////////

    // Needs to be unique relative to other windows/iframes
    //   Even if another window/iframe was opened in the same moment or the same page was opened
    //   In effect, making Math.random() more random by mixing in things that cannot be the same across different windows
    (function() {
        var currentTime = String(timeNow()),
            randomNumber = String(Math.random()),
            referrerUrl = String((window.document || {}).referrer);

        // Avoid scientific notation
        uniqueWindowId = (hashString(currentTime + '-' + randomNumber + '-' + referrerUrl) % 1000000000000000000000).toString();
    }());


    ////////////////////////////////////////////////////////////
    // Finding Things
    ////////////////////////////////////////////////////////////

    function findCommObject(origin, contentWindow) {
        var commObjects = commStore[origin] || [];

        return find(commObjects, function(commObject) {
            return commObject.details.contentWindow === contentWindow;
        });
    }

    function findComm(origin, contentWindow) {
        var commObject = findCommObject(origin, contentWindow);

        return (commObject || {}).comm;
    }


    ////////////////////////////////////////////////////////////
    // Sending Messages
    ////////////////////////////////////////////////////////////

    function sendMessage(origin, contentWindow, message) {
        // Prevent sending message to recently deleted iframe or window
        //   Be sure to nullify comms before removing their corresponding iframe or window
        if (!contentWindow)
        {
            return;
        }

        // Chrome, Safari, and Opera will trigger an error here for cross-domain iframe calls if the iframe has not yet loaded
        //   "Unable to post message to [iframe origin]. Recipient has origin [parent origin]."
        //   So far as I can tell, this is unavoidable and uncatchable, but it does not cause harm either
        //   This is why the ping system uses the wildcard origin
        contentWindow.postMessage(message, origin);
    }


    ////////////////////////////////////////////////////////////
    // Ping Messages
    ////////////////////////////////////////////////////////////

    function isPingMessage(message) {
        var isString = typeof message === 'string';
        return isString && pingMessageRegex.test(message);
    }

    function isPingFromHere(message) {
        return isPingMessage(message) && message.replace(pingMessagePrefix, '') === uniqueWindowId;
    }

    function messageReceivedSuccessly(details) {
        var successFunction = details.pingSuccess;

        details.isConnected = true;
        details.pingSuccess = noop;
        details.pingFailure = noop;

        // Could be a noop if the user had not tried to ping, expected and safe
        successFunction(findComm(details.origin, details.contentWindow));
    }

    function pingFailure(details) {
        var failureFunction = details.pingFailure;

        details.isConnected = false;
        details.pingSuccess = noop;
        details.pingFailure = noop;

        // Could be a noop if the user did not supply a failure function
        failureFunction(findComm(details.origin, details.contentWindow));
    }

    function tryPing(details) {
        var tryStartTime = timeNow(),
            tryMaxInterval = 5000, // 5 seconds max before failure
            tryTimeSeparation = 1, // in milliseconds
            pingMessage = pingMessagePrefix + uniqueWindowId;

        function pinger() {
            // Failed, stop
            if (timeNow() - tryStartTime >= tryMaxInterval)
            {
                pingFailure(details);
                return;
            }

            // Succeeded, stop
            if (details.isConnected)
            {
                return;
            }

            // Send ping messages via the wildcard origin
            //   Normally a security risk, we are only sending these messages to determine whether the other page can respond, not actually sending meaningful data
            //   By doing this, we avoid an uncatchable error in Chrome, Opera, and Safari.
            //   Bug report filed (but not public): https://code.google.com/p/chromium/issues/detail?id=306331
            //   Example case: http://jsfiddle.net/Znq5a/4/
            sendMessage('*', details.contentWindow, pingMessage);

            // Decrease the speed of tries the more their are, maxing out at 0.5 seconds per try
            //   Sequence goes like this: 1, 2, 4, 8, 16, 32, 64, 128, 256, 500, 500, 500, ...
            tryTimeSeparation = Math.min(tryTimeSeparation * 2, 500);

            window.setTimeout(pinger, tryTimeSeparation);
        }

        pinger();
    }


    ////////////////////////////////////////////////////////////
    // Receiving Messages
    ////////////////////////////////////////////////////////////

    function onMessageReceived(e) {
        var message = e.data,
            isPing = isPingMessage(message),
            isOriginalPing = isPingFromHere(message),
            commObject = findCommObject(e.origin, e.source);

        if (isPing && !isOriginalPing)
        {
            // Echo ping messages, even if there is no associated comm
            //   But do not echo pings originating at this window, or it could cause a feedback loop
            sendMessage(e.origin, e.source, message);
        }

        // Because we received a message, any message, this comm must now be connected
        if (commObject)
        {
            messageReceivedSuccessly(commObject.details);
        }

        // Only fire message handler callback function on non-ping messages
        if (commObject && !isPing)
        {
            commObject.details.messageHandler(message, commObject.comm);
        }

        // No found CommObject is not necessarily an error
        // PostComm.js does not usurp other message event handlers
    }


    ////////////////////////////////////////////////////////////
    // Window Connection
    ////////////////////////////////////////////////////////////

    // Safe from multiple attachments:
    //   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener#Multiple_identical_event_listeners
    function engage() {
        addEvent(window, 'message', onMessageReceived);
    }

    // Safe even if engage never called:
    //   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.removeEventListener#Compatibility
    function disengage() {
        removeEvent(window, 'message', onMessageReceived);
    }


    ////////////////////////////////////////////////////////////
    // Creating and Destroying Comms
    ////////////////////////////////////////////////////////////

    function registerComm(comm, details) {
        var origin = details.origin;

        // Add origin if does not exist
        maybeMakeProperty(commStore, origin, []);

        commStore[origin].push({
            comm: comm,
            details: details
        });
    }

    function unregisterComm(details) {
        var origin = details.origin,
            contentWindow = details.contentWindow,
            commObjects = commStore[origin] || [];

        // Abusing the find function to get index of commObject with matching contentWindow
        find(commObjects, function(commObject, index) {
            if (commObject.details.contentWindow === contentWindow)
            {
                commObjects.splice(index, 1);
                return true; // Stop searching early
            }
        });

        // No remaining comms on this origin, remove the key
        if (commObjects.length === 0)
        {
            delete commStore[origin];
        }
    }

    function nullifyComm(comm) {
        comm.getOrigin = noop;
        comm.getContentWindow = noop;
        comm.getMessageHandler = function() { return noop; };
        comm.isValid = function() { return false; };
        comm.isConnected = function() { return false; };
        comm.ping = noop;
        comm.sendMessage = noop;
        comm.destroy = noop;
    }

    function setupComm(comm, details) {
        comm.getOrigin = function() { return details.origin; };
        comm.getContentWindow = function() { return details.contentWindow; };
        comm.getMessageHandler = function() { return details.messageHandler; };
        comm.isValid = function() { return details.isValid; };
        comm.isConnected = function() { return details.isConnected; };
        comm.ping = function(onSuccess, onFailure) {
            details.isConnected = false;
            details.pingSuccess = onSuccess;
            details.pingFailure = onFailure || noop; // onFailure optional
            tryPing(details);
        };
        comm.sendMessage = function(message) {
            sendMessage(details.origin, details.contentWindow, message);
        };
        comm.destroy = function() {
            unregisterComm(details);
            nullifyComm(comm);
        };
    }

    function createComm(url, contentWindow, messageHandler) {
        var origin = convertUrlToOrigin(url),
            existingComm = findComm(origin, contentWindow),
            isValid,
            details,
            comm = {};

        // Comm already registered, return it instead of a new comm
        if (existingComm)
        {
            return existingComm;
        }

        isValid = isValidOrigin(origin) && isValidContentWindow(contentWindow);

        // Not a valid comm, return nullified comm
        if (!isValid)
        {
            nullifyComm(comm);
            return comm;
        }
        
        // Create valid comm
        details = {
            origin: origin,
            contentWindow: contentWindow,
            messageHandler: messageHandler,
            isValid: isValid,
            isConnected: false,
            pingSuccess: noop,
            pingFailure: noop
        };
        setupComm(comm, details);
        registerComm(comm, details);

        return comm;
    }

    function createIframeComm(iframe, messageHandler) {
        return createComm(iframe.src, iframe.contentWindow, messageHandler);
    }

    function createParentComm(messageHandler) {
        var parentUrl = (window.document || {}).referrer,
            parentContentWindow = window.opener || window.parent;
        
        return createComm(parentUrl, parentContentWindow, messageHandler);
    }


    ////////////////////////////////////////////////////////////
    // Microlibrary Boilerplate
    ////////////////////////////////////////////////////////////

    function noConflict() {
        window.postComm = postCommNamespace;
        return api;
    }

    // Define public interface using indirect references to protect internal use of public functions
    api.findComm = findComm;
    api.engage = engage;
    api.disengage = disengage;
    api.createComm = createComm;
    api.createIframeComm = createIframeComm;
    api.createParentComm = createParentComm;
    api.noConflict = noConflict;

    // Context does not support postMessage (old browser, or non-browser)
    // Modernizr-based test
    if (!window.postMessage)
    {
        return;
    }

    // By default, add namespace to window object
    // Use noConflict() to restore any existing namespace
    window.postComm = api;

    // By default, engage PostComm.js
    engage();

    // Make AMD Compliant
    // http://javascriptplayground.com/blog/2012/10/making-your-library-amd-compliant/
    // Ignoring CommonJS for now, since it is aimed at non-browsers anyway
    if (typeof window.define === 'function' && window.define.amd)
    {
        window.define('postComm', [], function() { return api; });
    }
}(this));