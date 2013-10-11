PostComm.js
===========

PostComm.js is a javascript microlibrary designed to handle the security and routing of postMessage events for mass numbers of iframes and windows.



Features
--------
* Creates persistent 'comm' objects that represent the connection across the iframe or window barrier
* Secure communication only, origin and contentWindow always checked
* Cross-domain or same-origin, works the same
* Only creates one comm per iframe, window, or parent page, preventing duplication
* Send and receive message events to any number of iframes and windows
* Pinging system to ensure that a connection is good before sending messages
* noConflict mode
* No dependancies
* Tiny (around 3.5k minified)
* Fully unit tested
* AMD compliant
* Only creates a single event listener on the window object
* Does not usurp control over postMessage events, other code can add its own postMessage event handlers
* Globally connect and disconnect all connections at any time




What PostComm.js is Not
-----------------------
* PostComm.js is not a general purpose postMessage compatibility shim for older browsers (try [Porthole](http://ternarylabs.github.io/porthole/) instead)
* PostComm can only communicate between iframes and windows (and the parent page if it is a child page) opened by the page in question, or with the parent of the page that opened the page. It cannot communicate with other windows or tabs the user opened, even if on the same domain. There is a way to do this, however, through use of the localStorage API (try [Intercom.js](https://github.com/diy/intercom.js/))



Basic Usage
-----------

<ol>
    <li>Download the <a href="https://raw.github.com/dwighthouse/PostComm.js/master/PostComm.js">PostComm.js</a> (or <a href="https://raw.github.com/dwighthouse/PostComm.js/master/PostComm.min.js">PostComm.min.js</a>) file and place it on the server
    <li>Link the file in the source.<br>
<pre lang="html">
&lt;script src="PostComm.js"&gt;&lt;/script&gt;
</pre>
    <li>Create a comm object<br>
<pre lang="javascript">
var myComm = postComm.createComm(childUrl, childContentWindow, myMessageHandler);
</pre>
    <li>For connecting to an iframe, window, or parent page that also uses PostComm.js, optionally ping the comm to ensure a known good connection
<pre lang="javascript">
function onSuccess(comm) {
    /* The comm is known to be connected */
}
function onFailure(comm) {
    /* The comm did not respond appropriately to the ping, the other page may still be loading */
}

myComm.ping(onSuccess, onFailure);
</pre>
    <li>Use the comm to send and receive messages
        <ul>
            <li>Send a message through the comm<br>
<pre lang="javascript">
myComm.sendMessage(myMessage);
</pre>
            <li>Messages received to this comm will call the myMessageHandler function<br>
<pre lang="javascript">
function myMessageHandler(message, comm) {
    /* Handle the message */
}
</pre>
        </ul>
</ol>


PostComm API
------------

### Find Comm

 * <strong>Params</strong>: URL string and contentWindow for iframe, window, or parent page
 * <strong>Returns</strong>: Matching comm if it already exists, otherwise undefined

```
var comm = postComm.findComm(url, contentWindow);
```


### Engage

PostComm.js will begin start listening to and routing postMessage events.

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: Nothing

*Called once automatically when PostComm.js is loaded*

```
postComm.engage();
```


### Disengage

PostComm.js will stop listening to postMessage events.
This only disconnects the listener, the comms are still valid and unchanged.
Call `postComm.engage()` to re-enable listening

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: Nothing

```
postComm.disengage();
```


### Create Comm

 * <strong>Params</strong>: Url string, contentWindow, and message handler callback function
 * <strong>Returns</strong>: Comm object (see [Comm Object API section](#commobject))

*Creating a comm object for a window created with `window.open()` requires the use of `createComm()`*

```
var myComm = postComm.createComm(childUrl, childContentWindow, myMessageHandler);
```


### Create iFrame Comm Shortcut

 * <strong>Params</strong>: Iframe element ([DOM element, not jQuery element](http://stackoverflow.com/questions/47837/getting-the-base-element-from-a-jquery-object)) and message handler callback function
 * <strong>Returns</strong>: Comm object (see [Comm Object API section](#commobject))

```
var myIframeComm = postComm.createIframeComm(iframeElement, myMessageHandler);
```


### Create Parent Comm Shortcut

 * <strong>Params</strong>: Message handler callback function
 * <strong>Returns</strong>: Comm object (see [Comm Object API section](#commobject))

```
var myParentComm = postComm.createParentComm(myMessageHandler);
```


### noConflict Mode

Restores the original value of 'postComm' to the window object, yeilding a reference to be assigned a new variable name

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The postComm reference object

```
var myPostComm = postComm.noConflict();
```

<span id="commobject"></span>
Comm Object API
---------------

A comm object maintains the unique connection to another iframe, window, or parent page. It provides information about the connection, can send messages across the connection, and destroy itself.


### Get origin

The origin is the base part of the URL without the trailing slash that is used for security on postMessage events. If the URL is `https://github.com/dwighthouse/PostComm.js`, the origin would be `https://github.com`

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The comm's origin

```
var origin = myComm.getOrigin();
```


### Get contentWindow

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The comm's contentWindow

```
var contentWindow = myComm.getContentWindow();
```


### Get Message Handler

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: The comm's message handler callback function

```
var messageHandler = myComm.getMessageHandler();
```


### Is Valid Comm

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: True if the comm has a valid connection, otherwise false

*A valid comm is not necessarily connected. The other page may still be loading or its own comm back to the parent may not be set up yet. Use the Ping method to ensure a good connection.*

```
var isValidComm = myComm.isValid();
```


### Is Connected

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: True if the comm has recieved any message, proving the connection is real

```
var isConnectedComm = myComm.isConnected();
```

*Can become false if `ping()` is called, but will become true again after another message is received*


### Ping

For comms with PostComm.js in use by both sides of the connection, pinging tests and confirms the connection without sending unnecessary noise to the comm's message handler callback function.

It is recommended to ping a comm before attempting to send messages through it. Pinging is an alternative to using setTimeout, window.load, and other possibly inadequate methods of ensuring a good connection.

Any page with PostComm.js enabled will echo pings back to the sender, confirming the connection for both sides. PostComm.js recognizes echoed pings and will not treat them as normal messages, so they will not propogate to the comm's message handler callback function.

Whether triggered by a ping or a normal message, when a message is received, the `onSuccess()` callback is called. The `onSuccess()` function can only be called once per call to `ping()`.

Pinging a comm fires a ping message to the other page several times at exponentially increasing intervals, up to a maximum timeout length. If the timeout is reached, the `onFailure(comm)` callback is called.

 * <strong>Params</strong>: onSuccess and onFailure callback functions
 * <strong>Returns</strong>: Nothing

<pre language="javasript">
function onSuccess(comm) {
    /* The comm is known to be connected */
}
function onFailure(comm) {
    /* The comm did not respond appropriately to the ping, the other page may still be loading */
}

myComm.ping(onSuccess, onFailure);
</pre>

*Both onSuccess and onFailure functions pass the comm object when called*



### Send Message

 * <strong>Params</strong>: Message to be sent over the connection
 * <strong>Returns</strong>: Nothing

```
myComm.sendMessage(message);
```


### Destroy Comm

Unregisters the comm from PostComm's message routing system and transforms the comm into a nullified comm.

 * <strong>Params</strong>: None
 * <strong>Returns</strong>: Nothing

```
myComm.destroy();
```


Nullified Comm Objects
----------------------

If a comm is destroyed, that comm object will be in a nullified state. A nullified comm is not registered with PostComm's message routing system, so its message handler callback function will never receive any messages.

If a comm is created with an invalid URL or contentWindow, the result is also a nullified comm.

A nullified comm has the same signature as a valid comm, but the results of each member function is different.

* `getOrigin()` - returns undefined
* `getContentWindow()` - returns undefined
* `getMessageHandler()` - returns a noop function
* `isValid()` - returns false
* `isConnected()` - returns false
* `ping(onSuccess, onFailure)` - does nothing
* `sendMessage(message)` - does nothing
* `destroy()` - does nothing




Unit Tests
----------

[Run the unit tests online](http://dwighthouse.github.io/PostComm.js/) without downloading the code or setting up servers. Instructions to manually run tests can be found on the [test page](http://dwighthouse.github.io/PostComm.js/PostComm.js/test/Testing.Main.html) itself.




Compatibility
-------------

These browsers successfully passed all unit tests

* Google Chrome 30
* Mozilla Firefox 24
* Opera 15
* Safari 6.0.5


### Internet Explorer

Internet Explorer was not tested recently, but tests with previous versions of PostComm.js yeilded these results:

* Internet Explorer 9 successfully passed all except the window-based tests (known issue)
* Internet Explorer 9 cannot send object messages, but can send string messages (known issue)
* Check this [compatibility chart](http://caniuse.com/#search=postmessage) for more information

Use [Porthole](http://ternarylabs.github.io/porthole/) for general postMessage-style cross-domain iframe communication for older browsers, but no routing capabilities.




Known Issues
------------

There may be exceedingly rare conditions in which a message can be sent from a window or iframe that is then closed before the parent page has a chance to process the message. After attempting to duplicate the conditions for a unit test and failing, I assume that it is too rare an occurance to worry about.
