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
        nsPostComm = window.postComm,
        commStore = {},
        api = {};

    // Structure of commStore:
    // {
    //     origin1: [
    //         comm1, // associated with origin1 and contentWindow1
    //         comm2, // associated with origin1 and contentWindow2
    //         ...
    //     ],
    //     origin2: [
    //         comm3, // associated with origin2 and contentWindow3
    //     ]
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

    function maybeMakeProperty(object, key, defaultValue) {
        // If the key already exists, there is no effect, as the value of an object's unassigned key is undefined
        object[key] = object.hasOwnProperty(key) ? object[key] : defaultValue;
    }

    function isValidOrigin(origin) {
        return (/^https?:\/\//).test(origin);
    }

    function isValidSource(source) {
        return source && source.window && source === source.window;
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

    function getParentContentWindow() {
        return window.opener || window.parent;
    }

    function getParentOrigin() {
        var referrer = (window.document || {}).referrer;
        return referrer ? convertUrlToOrigin(referrer) : [].u; // undefined
    }


    ////////////////////////////////////////////////////////////
    // Finding Things
    ////////////////////////////////////////////////////////////

    function findComm(origin, contentWindow) {
        var comms = commStore[origin] || [];

        return find(comms, function(comm) {
            return comm.getContentWindow() === contentWindow;
        });
    }


    ////////////////////////////////////////////////////////////
    // Handling Messages
    ////////////////////////////////////////////////////////////

    function onMessageReceived(e) {
        var comm = findComm(e.origin, e.source);

        // No found CommObject is not necessarily an error
        // PostComm.js does not usurp other message event handlers
        if (comm)
        {
            (comm.getMessageHandler())(e.data, comm);
        }
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

    function registerComm(comm) {
        var origin = comm.getOrigin();

        // Add origin if does not exist
        maybeMakeProperty(commStore, origin, []);

        commStore[origin].push(comm);

        return comm;
    }

    function unregisterComm(comm) {
        var origin = comm.getOrigin(),
            contentWindow = comm.getContentWindow(),
            comms = commStore[origin] || [];

        // Abusing the find function to get index of matching contentWindow
        find(comms, function(queriedComm, index) {
            if (queriedComm.getContentWindow() === contentWindow)
            {
                comms.splice(index, 1);
                return true; // Stop searching early
            }
        });

        // No remaining comms on this origin, remove the key
        if (comms.length === 0)
        {
            delete commStore[origin];
        }
    }

    function nullifyComm(comm) {
        comm.getOrigin = noop;
        comm.getContentWindow = noop;
        comm.getMessageHandler = function() {
            return noop;
        };
        comm.isValid = function() {
            return false;
        };
        comm.sendMessage = noop;
        comm.destroy = noop;

        return comm;
    }

    function createComm(origin, contentWindow, messageHandler) {
        var existingComm = findComm(origin, contentWindow),
            isValid = isValidOrigin(origin) && isValidSource(contentWindow),
            comm = {};

        // Comm already registered, return it instead of a new comm
        if (existingComm)
        {
            return existingComm;
        }

        if (isValid)
        {
            // Create valid comm
            comm = {
                getOrigin: function() { return origin; },
                getContentWindow: function() { return contentWindow; },
                getMessageHandler: function() { return messageHandler; },
                isValid: function() { return isValid; },
                sendMessage: function(message) {
                    contentWindow.postMessage(message, origin);
                },
                destroy: function() {
                    unregisterComm(comm);
                    nullifyComm(comm);
                }
            };
        }

        return isValid ? registerComm(comm) : nullifyComm(comm);
    }

    function createIframeComm(iframe, messageHandler) {
        var origin = convertUrlToOrigin(iframe.src);
        return createComm(origin, iframe.contentWindow, messageHandler);
    }

    function createParentComm(messageHandler) {
        return createComm(getParentOrigin(), getParentContentWindow(), messageHandler);
    }


    ////////////////////////////////////////////////////////////
    // Microlibrary Boilerplate
    ////////////////////////////////////////////////////////////

    function noConflict() {
        window.postComm = nsPostComm;
        return api;
    }

    // Define public interface using indirect references to protect internal use of public functions
    api.convertUrlToOrigin = convertUrlToOrigin;
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