(function() {

    if (!skipWindowTests)
    {

        var comm;

        module('Parent window communication', {
            setup: function() {
                PostComm.engage();
            },
            teardown: function() {
                if (comm !== undefined)
                {
                    comm.destroy();
                }
                PostComm.disengage();
            }
        });

        asyncTest('Same domain window communication', 1, function() {
            var childWindow = createWindow('samedomainparentwindowhelper', sameDomainChildPath);

            // No apparent way to reliably detect load event on cross-domain window, unlike cross-domain iframes, which respond to the jquery load() event
            setTimeout(function() {
                comm = PostComm.createComm(childWindow.location.origin, childWindow, function(message, comm) {
                    clearTimeout(timeoutId);
                    equal(message, 'message', 'Child window returned expected message');
                    start();
                    childWindow.close();
                });

                comm.sendMessage('message');
            }, 1000);

            var timeoutId = setTimeout(function() {
                ok(false, 'Bailed out of same domain window communication test, window did not load or Child did not call postMessage');
                start();
                childWindow.close();
            }, 2000);
        });

        asyncTest('Cross-domain window communication', 1, function() {
            var childWindow = createWindow('crossdomainparentwindowhelper', crossDomainChildPath);

            // No apparent way to detect load event on cross-domain window, unlike cross-domain iframes, which respond to the jquery load() event
            setTimeout(function() {
                comm = PostComm.createComm(PostComm.convertUrlToOrigin(crossDomainChildPath), childWindow, function(message, comm) {
                    clearTimeout(timeoutId);
                    equal(message, 'message', 'Child window returned expected message');
                    start();
                    childWindow.close();
                });

                comm.sendMessage('message');
            }, 1000);
            

            var timeoutId = setTimeout(function() {
                ok(false, 'Bailed out of cross-domain window communication test, window did not load or Child did not call postMessage');
                start();
                childWindow.close();
            }, 2000);
        });

    }

}());