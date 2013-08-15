PostComm.js
===========

PostComm.js is a javascript microlibrary designed to handle the security and routing of postMessage events for mass numbers of iframes and windows.



Features
--------

* Creates persistant 'comm' objects that prepresent the connection across the iframe or window barrier
* Handles the origin-based security for you
* Only creates one comm per iframe or window, preventing duplication
* Send and receive postMessage events to any number of iframes and windows
* Send and receive postMessage events cross-domain
* NoConflict mode
* No dependancies
* AMD compliant
* Error message callback customization
* Creates a single postMessage event binding, not one per comm
* Does not usurp control over postMessage events, other code can add their own postMessage event handlers
* Globally connect and disconnect all connections at any time




What PostComm.js is Not
-----------------------

* PostComm.js is not a general purpose postMessage compatibility shim for older browsers ([try porthole instead](http://ternarylabs.github.io/porthole/))
* Using PostComm.js for a single connection is overkill. Though it can handle a single connection, it is primarily designed for communication with dozens of iframes or windows without interferance.



Usage
-----

Download the [PostComm.js](https://raw.github.com/dwighthouse/PostComm.js/master/PostComm.js) (or [PostComm.min.js](https://raw.github.com/dwighthouse/PostComm.js/master/PostComm.min.js)) file to your site's directory.

Link the file in your source.

    <script src="PostComm.js"></script>

Engage the library so it can listen to message events

    PostComm.engage();

To listen to a child iframe or window manually

    var myComm = PostComm.createComm(childOrigin, childContentWindow, myMessageHandler);

A shortcut to listen to a child iframe if you have the iframe element

    var myIframeComm = PostComm.createIframeComm(iframeElement, myMessageHandler);

A shortcut to listen to a parent (iframe container or parent window)

    var myParentComm = PostComm.createParentComm(myMessageHandler);

*Note: PostComm.js assumes that the contentWindow is known prior to creating a comm. Thus, if the window or iframe is still loading when you create a comm, you may not generate a valid comm.*

You can check that your comm is valid

    console.log('myComm is valid: ' + myComm.isValid());

Send a message through your comm to its iframe or window

    myComm.sendMessage(myMessage);

*Note: a message can be any object or string, except in certain cases, see Compatibility section below.*

Received messages on your comm go to the callback you provided when you created the comm

    function myMessageHandler(message, comm) {
        console.log('The message sent to me: ' + message);
        console.log('The comm associated with this message: ' + comm);
    }



PostComm API
------------

### Origin Conversion Utility

Takes a URL string. Returns the origin string for that URL. Expects valid URLs, could return a mangled string if given an invalid URL. The origin is everything from "http://" or "https://" to the end or the third slash (/), whichever comes first. Checking for expected origins is how the low-level postMessage API handles security.

    var origin = PostComm.convertUrlToOrigin(url);


### Find Comm

Takes an origin string and a contentWindow. Returns the matching comm if it already exists. Otherwise, it returns undefined.

    var comm = PostComm.findComm(origin, contentWindow);


### Engage

Allow PostComm.js to start listening to and routing postMessage events (not called by default)

    PostComm.engage();


### Disengage

Stops PostComm.js from listening to postMessage events. This only disconnects the listener, comms are still valid, they just won't send or receive messages until PostComm.js is re-engaged.

    PostComm.disengage();


### Create Comm

Takes an origin string, a contentWindow, and a message handler callback function. Returns a Comm object (see Comm Object API).

    var myComm = PostComm.createComm(childOrigin, childContentWindow, myMessageHandler);

*If contentWindow is not yet valid because the other page has not finished loading, the Comm object may not be created correctly.*


### Create iFrame Comm Shortcut

Able to use an iframe element to find the origin and contentWindow for you. Takes an iframe element ([the actual element, not a jQuery wrapper](http://stackoverflow.com/questions/47837/getting-the-base-element-from-a-jquery-object)) and a message handler callback function. Returns a Comm object (see Comm Object API).

    var myIframeComm = PostComm.createIframeComm(iframeElement, myMessageHandler);

*If contentWindow is not yet valid because the other page has not finished loading, the Comm object may not be created correctly.*


### Create Parent Comm Shortcut

Able to use window variables available when a page is opened as a child to find the origin and contentWindow for you. Takes a message handler callback function. Returns a Comm object (see Comm Object API).

    var myParentComm = PostComm.createParentComm(myMessageHandler);

*If contentWindow is not yet valid because the other page has not finished loading, the Comm object may not be created correctly.*


### NoConflict Mode

Restores the original value of 'PostComm' to the window object. Returns the PostComm object.

    var MyPostComm = PostComm.noConflict();


### Replace Error Message Handler

Allows you to receive error messages generated by PostComm and handle them as you desire (plug them into an existing error system, use console.log(), or ignore them entirely). The default function prints to console.log().

    PostComm.errorMessage = function(errorMessage) {
        // Ignore error messages
    };

At this time, only one error message can be generated (which is note necessarily an error): when PostComm is enabled and a postMessage event fires for which there is no associated Comm, PostComm will inform you of an "Unknown Comm".



Comm Object API
---------------

A Comm object maintains the unique connection to another iframe or window. It provides information about the connection, can send messages across the connection, and destroy itself.

If a Comm is created with an invalid origin or contentWindow, the result is a null Comm. A null Comm does not get registered with PostComm's message routing system. Thus, it will never receive any messages. A null Comm has the same object signature, but provides read-only functionality. Specifically:

* getOrigin() - returns the origin it was given
* getContentWindow() - returns the contentWindow it was given
* getMessageHandler() - returns the callback it was given
* isValid() - returns false
* sendMessage() - does nothing
* destroy() - does nothing


### Get Origin

Returns the origin supplied at the Comm's creation.

    var origin = comm.getOrigin();


### Get contentWindow

Returns the contentWindow supplied at the Comm's creation.

    var contentWindow = comm.getContentWindow();


### Get Message Handler

Returns the message handler callback function supplied at the Comm's creation.

    var messageHandler = comm.getMessageHandler();


### Is Valid Comm

Returns true if the origin and contentWindow are valid, and the Comm hasn't yet been destroyed.

    var isValidComm = comm.isValid();


### Send Message

Takes a message object or string and sends it over the Comm's connection if the Comm is valid.

    comm.sendMessage(message);


### Destroy Comm

Unregisters the Comm from PostComm's managed Comm list and deactivates the Comm. After destroying a Comm

* getOrigin() and getContentWindow() will return undefined
* getMessageHandler() will return a different function that does nothing
* isValid() will always report false
* sendMessage() and destroy() will do nothing



Compatibility
-------------

These browsers successfully passed all unit tests

* Google Chrome 28
* Mozilla Firefox 21
* Opera 15
* Safari 6.0.5


### Internet Explorer

* Internet Explorer 9 successfully passed all except the window-based tests (known issue)
* Internet Explorer 9 cannot send object messages, but can send string messages (known issue)
* Check this [compatibility chart](http://caniuse.com/#search=postmessage) for more information

If you want general postMessage-style cross-domain iframe communication for older browsers, but no routing capabilities, try [Porthole](http://ternarylabs.github.io/porthole/).




Unit Tests
----------

You can [run the unit tests online](http://dwighthouse.github.io/PostComm.js/) without downloading the code or setting up your own servers. If you want to run the tests yourself, see [instructions on the test page](http://dwighthouse.github.io/PostComm.js/Testing/Testing.Main.html).




Future Work
-----------

As alluded to above, it is possible to attempt to create a Comm object before the iframe or window has finished loading. This can cause the contentWindow to be invalid and create a null Comm object, which is useless.

jQuery's load() function attached to an iframe appears to work well and is used in the unit tests. The loading of windows, however, cannot so easily be measured, especially if on another domain. The unit tests simply used a setTimeout() to give popups time to load.

Creating a Comm to the parent window should almost never run into this problem, although it is conceivable.

Thus, a helper script that assumes PostComm.js to be used on both sides of the connection could be used to negotiate the timing of the two Comms' creation by broadcasting and listening for existance messages every so often until both sides acknowledged the other. If such a script is made, it will be linked here.




