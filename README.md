PostComm.js
===========

PostComm.js is a javascript microlibrary designed to handle the security and routing of postMessage events for mass numbers of iframes and windows.



Features
--------
* Creates persistent 'comm' objects that represent the connection across the iframe or window barrier
* Handles the origin-based security for you
* Only creates one comm per iframe or window, preventing duplication
* Send and receive postMessage events to any number of iframes and windows
* Send and receive postMessage events cross-domain
* noConflict mode
* No dependancies
* Tiny (under 3k minified)
* AMD compliant
* Creates a single postMessage event binding, not one per comm
* Does not usurp control over postMessage events, other code can add its own postMessage event handlers
* Globally connect and disconnect all connections at any time




What PostComm.js is Not
-----------------------
* PostComm.js is not a general purpose postMessage compatibility shim for older browsers (try [Porthole](http://ternarylabs.github.io/porthole/) instead)
* Using PostComm.js for a single connection is overkill. Though it can handle a single connection, it is primarily designed for communication with dozens of iframes or windows without interference
* PostComm can only communicate between iframes and windows opened by the page in question. It cannot communicate with other windows or tabs the user opened, even if on the same domain. There is a way to do this, however, through use of the localStorage API (try [Intercom.js](https://github.com/diy/intercom.js/))



Basic Usage
-----------

<ol>
    <li>Download the <a href="https://raw.github.com/dwighthouse/PostComm.js/master/PostComm.js">PostComm.js</a> (or <a href="https://raw.github.com/dwighthouse/PostComm.js/master/PostComm.min.js">PostComm.min.js</a>) file and place it on the server
    <li>Link the file in your source.<br>
<pre lang="html">
&lt;script src="PostComm.js"&gt;&lt;/script&gt;
</pre>
    <li>Create a comm object<br>
<pre lang="javascript">
var myComm = postComm.createComm(childOrigin, childContentWindow, myMessageHandler);
</pre>
<em>The child iframe or window must already have already finished loading</em>
    <li>Use the comm to send and receive messages
        <ul>
            <li>Send a message through the comm<br>
<pre lang="javascript">
myComm.sendMessage(myMessage);
</pre>
            <li>Messages received to this comm will call the myMessageHandler function<br>
<pre lang="javascript">
function myMessageHandler(message, comm)
{
    /* Handle the message */
}
</pre>
        </ul>
</ol>


PostComm API
------------

### Origin Conversion Utility

 * <strong>Params</strong>: URL string
 * <strong>Returns</strong>: Origin string for input URL

*Could return a mangled string if given an invalid URL*

```javascript
var origin = postComm.convertUrlToOrigin(url);
```


### Find Comm

 * <strong>Params</strong>: Origin string and contentWindow for iframe or window
 * <strong>Returns</strong>: Matching comm if it already exists, otherwise undefined

```javascript
var comm = postComm.findComm(origin, contentWindow);
```


### Engage

PostComm.js will begin start listening to and routing postMessage events.

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: Nothing

*Called once automatically when PostComm.js is loaded*

```javascript
postComm.engage();
```


### Disengage

PostComm.js will stop listening to postMessage events.
This only disconnects the listener, the comms are still valid and unchanged.
Call `postComm.engage()` to re-enable listening

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: Nothing

```javascript
postComm.disengage();
```


### Create Comm

 * <strong>Params</strong>: Origin string, contentWindow, and message handler callback function
 * <strong>Returns</strong>: Comm object (see [Comm Object API section](#commobject))

*The associated iframe or window must have already finished loading*

```javascript
var myComm = postComm.createComm(childOrigin, childContentWindow, myMessageHandler);
```


### Create iFrame Comm Shortcut

 * <strong>Params</strong>: Iframe element ([DOM element, not jQuery element](http://stackoverflow.com/questions/47837/getting-the-base-element-from-a-jquery-object)) and message handler callback function
 * <strong>Returns</strong>: Comm object (see [Comm Object API section](#commobject))

*The associated iframe must have already finished loading*

```javascript
var myIframeComm = postComm.createIframeComm(iframeElement, myMessageHandler);
```


### Create Parent Comm Shortcut

 * <strong>Params</strong>: Message handler callback function
 * <strong>Returns</strong>: Comm object (see [Comm Object API section](#commobject))

*The associated parent (containing window) must have already finished loading*

```javascript
var myParentComm = postComm.createParentComm(myMessageHandler);
```


### noConflict Mode

Restores the original value of 'postComm' to the window object, yeilding a reference to be assigned a new variable name

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The postComm reference object

```javascript
var myPostComm = postComm.noConflict();
```

<span id="commobject"></span>
Comm Object API
---------------

A comm object maintains the unique connection to another iframe or window. It provides information about the connection, can send messages across the connection, and destroy itself.


### Get Origin

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The comm's origin

```javascript
var origin = myComm.getOrigin();
```


### Get contentWindow

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The comm's contentWindow

```javascript
var contentWindow = myComm.getContentWindow();
```


### Get Message Handler

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The comm's message handler callback function

```javascript
var messageHandler = myComm.getMessageHandler();
```


### Is Valid Comm

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: True if the comm has a valid connection, otherwise false

```javascript
var isValidComm = myComm.isValid();
```


### Send Message

 * <strong>Params</strong>: Message to be sent over the connection
 * <strong>Returns</strong>: Nothing

```javascript
myComm.sendMessage(message);
```


### Destroy Comm

Unregisters the comm from PostComm's message routing system and transforms the comm into a nullified comm.

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: Nothing

```javascript
myComm.destroy();
```


Nullified Comm Objects
----------------------

If a comm is destroyed, that comm object will be in a nullified state. A nullified comm is not registered with PostComm's message routing system, so its message handler callback function will never receive any messages.

If a comm is created with an invalid origin or contentWindow, the result is also a nullified comm.

A nullified comm has the same signature as a valid comm, but the results of each member function is different.

* `getOrigin()` - returns undefined
* `getContentWindow()` - returns undefined
* `getMessageHandler()` - returns a noop function
* `isValid()` - returns false
* `sendMessage(message)` - does nothing
* `destroy()` - does nothing


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

You can [run the unit tests online](http://dwighthouse.github.io/PostComm.js/) without downloading the code or setting up your own servers. If you want to run the tests yourself, see [instructions on the test page](http://dwighthouse.github.io/PostComm.js/PostComm.js/test/Testing.Main.html).




Future Work
-----------

As alluded to above, it is possible to attempt to create a comm object before the iframe or window has finished loading, creating an invalid (nullified) comm object.

jQuery's load() function attached to an iframe appears to work well and is used in the unit tests. The loading of windows, however, cannot so easily be measured, especially if on another domain. The unit tests simply used a setTimeout() to give popups time to load.

Creating a Comm to the parent window should almost never run into this problem, although it is conceivable.

Thus, a helper script that assumes PostComm.js to be used on both sides of the connection could be used to negotiate the timing of the two Comms' creation by broadcasting and listening for existance messages every so often until both sides acknowledged the other. If such a script is made, it will be linked here.
