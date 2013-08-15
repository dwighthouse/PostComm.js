(function() {

    var comm;

    module('Parent iFrame communication', {
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

    asyncTest('Same domain iFrame communication', 1, function() {
        var iframe = createIframe('SameDomain', 'Testing.ChildHelper.html');

        $(iframe).load(function() {
            comm = PostComm.createIframeComm(iframe, function(message, comm) {
                clearTimeout(timeoutId);
                equal(message, 'message', 'Child iframe returned expected message');
                start();
            });

            comm.sendMessage('message');
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of same domain iFrame communication test, iframe did not load or Child did not call postMessage');
            start();
        }, 1000);
    });

    asyncTest('Cross-domain iFrame communication', 1, function() {
        var url = otherDomainPath + 'Testing.ChildHelper.html';
        var iframe = createIframe('CrossDomain', url);

        $(iframe).load(function() {
            comm = PostComm.createIframeComm(iframe, function(message, comm) {
                clearTimeout(timeoutId);
                equal(message, 'message', 'Child iframe returned expected message');
                start();
            });

            comm.sendMessage('message');
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of cross-domain iFrame communication test, iframe did not load or Child did not call postMessage');
            start();
        }, 2000);
    });

}());