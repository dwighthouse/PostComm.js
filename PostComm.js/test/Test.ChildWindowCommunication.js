(function() {

    if (!skipWindowTests)
    {

        var comm;

        module('Child window communication', {
            setup: function() {
                
            },
            teardown: function() {
                if (comm !== undefined)
                {
                    comm.destroy();
                }
            }
        });

        asyncTest('Same domain window communication', 1, function() {
            var childWindow = createWindow('samedomainchildwindowhelper', sameDomainEchoPath);

            // No apparent way to reliably detect load event on cross-domain window, unlike cross-domain iframes, which respond to the jquery load() event
            setTimeout(function() {
                comm = postComm.createComm(childWindow.location.origin, childWindow, function(message, comm) {
                    clearTimeout(timeoutId);
                    equal(message, 'message', 'Echo window returned expected message');
                    start();
                    childWindow.close();
                });

                comm.sendMessage('message');
            }, 1000);

            var timeoutId = setTimeout(function() {
                ok(false, 'Bailed out of same domain window communication test, window did not load or Echo did not call postMessage');
                start();
                childWindow.close();
            }, 2000);
        });

        asyncTest('Cross-domain window communication', 1, function() {
            var childWindow = createWindow('crossdomainchildwindowhelper', crossDomainEchoPath);

            // No apparent way to reliably detect load event on cross-domain window, unlike cross-domain iframes, which respond to the jquery load() event
            setTimeout(function() {
                comm = postComm.createComm(postComm.convertUrlToOrigin(crossDomainEchoPath), childWindow, function(message, comm) {
                    clearTimeout(timeoutId);
                    equal(message, 'message', 'Echo window returned expected message');
                    start();
                    childWindow.close();
                });

                comm.sendMessage('message');
            }, 1000);
            

            var timeoutId = setTimeout(function() {
                ok(false, 'Bailed out of cross-domain window communication test, window did not load or Echo did not call postMessage');
                start();
                childWindow.close();
            }, 2000);
        });

    }

}());