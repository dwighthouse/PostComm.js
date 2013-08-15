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
    var undefined, // Technically illegal (and JSLint complains), but necessary for safety on older browsers
        addEvent,
        removeEvent,
        nsPostComm = window.PostComm,
        commStore = {},
        api = {};

    // Structure of commStore:
    // {
    //     origin: [
    //         { source, comm, details },
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
            el['on' + ev] =  fn;
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
            el['on' + ev] =  undefined;
        };
    }());

    function objectArrayIndexOf(objectArray, propertyName, value) {
        var i,
            length = objectArray.length;

        for (i = 0; i < length; i += 1)
        {
            if ((objectArray[i])[propertyName] === value)
            {
                return i;
            }
        }

        return -1;
    }

    function maybeMakeProperty(object, propertyName, defaultValue) {
        if (!object.hasOwnProperty(propertyName))
        {
            object[propertyName] = defaultValue;
        }
    }

    function isValidOrigin(origin) {
        return (/^https?:\/\//).test(origin);
    }

    function isValidSource(source) {
        return source && source.window && source === source.window;
    }

    function noOp() {
        // Do nothing
        return;
    }

    api.convertUrlToOrigin = function(url) {
        var start = url.indexOf('//') + 2,
            thirdSlashIndex = url.indexOf('/', start);

        if (thirdSlashIndex !== -1)
        {
            return url.substr(0, thirdSlashIndex);
        }

        return url;
    };

    function getParentContentWindow() {
        return window.opener || window.parent;
    }

    function getParentOrigin() {
        var referrer = (window.document || {}).referrer;
        return referrer !== undefined ? api.convertUrlToOrigin(referrer) : undefined;
    }


    ////////////////////////////////////////////////////////////
    // Finding Things
    ////////////////////////////////////////////////////////////

    function findSources(origin) {
        return commStore[origin];
    }

    function findCommObject(origin, source) {
        var sources = findSources(origin),
            index;

        if (sources === undefined)
        {
            return undefined;
        }

        index = objectArrayIndexOf(sources, 'source', source);

        return index !== -1 ? sources[index] : undefined;
    }

    api.findComm = function(origin, contentWindow) {
        var commObject = findCommObject(origin, contentWindow);

        return commObject !== undefined ? commObject.comm : undefined;
    };


    ////////////////////////////////////////////////////////////
    // Handling Messages
    ////////////////////////////////////////////////////////////

    function onMessageReceived(e) {
        var commObject = findCommObject(e.origin, e.source);

        if (commObject === undefined)
        {
            // Not necessarily an error, since PostComm.js doesn't usurp other functions from handling message events
            api.errorMessage('Unknown Comm');
            return;
        }

        commObject.details.messageHandler(e.data, commObject.comm);
    }


    ////////////////////////////////////////////////////////////
    // Window Connection
    ////////////////////////////////////////////////////////////

    // Safe from multiple attachments:
    //   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener#Multiple_identical_event_listeners
    api.engage = function() {
        addEvent(window, 'message', onMessageReceived);
    };

    // Safe even if engage never called:
    //   https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.removeEventListener#Compatibility
    api.disengage = function() {
        removeEvent(window, 'message', onMessageReceived);
    };


    ////////////////////////////////////////////////////////////
    // Creating and Destroying Comms
    ////////////////////////////////////////////////////////////

    function registerComm(comm, details) {
        var origin = details.origin,
            commData = {
                source: details.source, // Duplicate to make searching easier
                comm: comm, // Store so we can find the comm internally
                details: details
            };

        // Add origin if does not exist
        maybeMakeProperty(commStore, origin, []);

        commStore[origin].push(commData);
    }

    function unregisterComm(details) {
        var origin = details.origin,
            sources = findSources(origin),
            index;

        // Should not ever occur because unregistration functions only become active if the comm has been registered
        if (sources === undefined)
        {
            api.errorMessage('Internal Error: Function unregisterComm called on Comm with unknown origin');
            return;
        }

        index = objectArrayIndexOf(sources, 'source', details.source);

        // Should not ever occur because unregistration functions only become active if the comm has been registered
        if (index === -1)
        {
            api.errorMessage('Internal Error: Function unregisterComm called on Comm with unknown source');
            return;
        }

        // At this point, we know the comm exists in the commStore
        sources.splice(index, 1);

        // No remaining sources on this origin
        if (sources.length === 0)
        {
            delete commStore[origin];
        }
    }

    api.createComm = function(origin, contentWindow, messageHandler) {
        var details = {},
            comm = {},
            existingComm = api.findComm(origin, contentWindow);

        // Comm already registered, return it instead of a new comm
        if (existingComm !== undefined)
        {
            return existingComm;
        }

        // Store data as local private variables so that they can't be modified on the fly
        details.origin = origin;
        details.source = contentWindow;
        details.messageHandler = messageHandler;
        details.isValid = isValidOrigin(origin) && isValidSource(contentWindow);

        comm.getOrigin = function() {
            return details.origin;
        };

        comm.getContentWindow = function() {
            return details.source;
        };

        comm.getMessageHandler = function() {
            return details.messageHandler;
        };

        comm.isValid = function() {
            return details.isValid;
        };

        function sendMessage(message) {
            details.source.postMessage(message, details.origin);
        }

        function destroy() {
            unregisterComm(details);

            // Shutdown object and api
            details = undefined;

            comm.getOrigin = noOp;
            comm.getContentWindow = noOp;
            comm.getMessageHandler = function() {
                return noOp;
            };
            comm.isValid = function() {
                return false;
            };
            comm.destroy = noOp;
            comm.sendMessage = noOp;
        }

        // Invalid comms contain the data given them, but are not functional or registered
        comm.sendMessage = noOp;
        comm.destroy = noOp;

        if (details.isValid)
        {
            comm.sendMessage = sendMessage;
            comm.destroy = destroy;
            registerComm(comm, details);
        }

        return comm;
    };

    api.createIframeComm = function(iframe, messageHandler) {
        var origin = api.convertUrlToOrigin(iframe.src);
        return api.createComm(origin, iframe.contentWindow, messageHandler);
    };

    api.createParentComm = function(messageHandler) {
        return api.createComm(getParentOrigin(), getParentContentWindow(), messageHandler);
    };


    ////////////////////////////////////////////////////////////
    // Microlibrary Boilerplate
    ////////////////////////////////////////////////////////////

    api.noConflict = function() {
        window.PostComm = nsPostComm;
        return api;
    };

    api.errorMessage = function(errorMessage) {
        return window.console && window.console.log && window.console.log(errorMessage);
    };

    // Context doesn't support postMessage (old browser, or non-browser)
    // Modernizr-based test
    if (!window.postMessage)
    {
        return;
    }

    // By default, add namespace to window object
    // Use noConflict() to restore any existing namespace
    window.PostComm = api;

    // Make AMD Compliant
    // http://javascriptplayground.com/blog/2012/10/making-your-library-amd-compliant/
    // Ignoring CommonJS for now, since it is aimed at non-browsers anyway
    if (typeof window.define === 'function' && window.define.amd)
    {
        window.define('postComm', [], function() { return api; });
    }
}(this));