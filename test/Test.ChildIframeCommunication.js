(function() {

    var comm;

    module('Child iFrame communication', {
        setup: function() {
            
        },
        teardown: function() {
            if (comm !== undefined)
            {
                comm.destroy();
            }
        }
    });

    asyncTest('Same domain iFrame communication', 1, function() {
        var iframe = createIframe('SameDomain', sameDomainEchoPath);

        $(iframe).load(function() {
            comm = postComm.createIframeComm(iframe, function(message, comm) {
                clearTimeout(timeoutId);
                equal(message, 'message', 'Echo iframe returned expected message');
                start();
            });

            comm.sendMessage('message');
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of same domain iFrame communication test, iframe did not load or Echo did not call postMessage');
            start();
        }, 1000);
    });

    asyncTest('Cross-domain iFrame communication', 1, function() {
        var iframe = createIframe('CrossDomain', crossDomainEchoPath);

        $(iframe).load(function() {
            comm = postComm.createIframeComm(iframe, function(message, comm) {
                clearTimeout(timeoutId);
                equal(message, 'message', 'Echo iframe returned expected message');
                start();
            });

            comm.sendMessage('message');
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of cross-domain iFrame communication test, iframe did not load or Echo did not call postMessage');
            start();
        }, 2000);
    });

}());