(function() {

    module('Core requirements');

    test('Browser/environment is capable of postMessage', function() {
        equal(typeOf(window.postMessage), 'function', 'Browser/environment does have postMessage function');
    });

    asyncTest('PostMessage can send objects in addition to strings', 1, function() {
        var iframe = createIframe('postmessagetransferringobjects', sameDomainEchoPath),
            comm = postComm.createIframeComm(iframe, callback),
            currentTime = (+(new Date())),
            messageObject = {
                'currentTime': (+(new Date()))
            },
            timeoutId;

        function callback(message) {
            clearTimeout(timeoutId);

            var transferredValue = (message || {}).currentTime;

            equal(transferredValue, currentTime, 'PostMessage correctly preserved an object');

            start();
        }

        timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of test, took too long to receive message from child');

            start();
        }, 2000);

        setTimeout(function() {
            comm.sendMessage(messageObject);
        }, 1000);
    });

    test('postComm added to global namespace', function() {
        equal(typeOf(window.postComm), 'object', 'postComm detected in global namespace');
    });

    test('noConflict removes PostComm from global namespace', function() {
        var api = window.postComm;
        window.postComm.noConflict();
        equal(window.postComm, undefined, 'postComm not detected in global namespace');

        window.postComm = api;
    });

}());