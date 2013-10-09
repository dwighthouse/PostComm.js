(function() {

    var comm;

    module('Engage and disengage', {
        setup: function() {
            
        },
        teardown: function() {
            if (comm !== undefined)
            {
                comm.destroy();
            }
            postComm.engage();
        }
    });

    asyncTest('Disengage', 1, function() {
        var iframe = createIframe('disengage', sameDomainEchoPath),
            defaultMessage = 'not message';

        postComm.disengage();

        $(iframe).load(function() {
            comm = postComm.createIframeComm(iframe, function(message, comm) {
                defaultMessage = message;
            });

            comm.sendMessage('message');

            setTimeout(function() {
                clearTimeout(timeoutId);
                equal(defaultMessage, 'not message', 'Disengaged PostComm did not receive the message');
                start();
            }, 100);
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of Disengage test, iframe did not load');
            start();
        }, 1000);
    });

    asyncTest('Re-engage (disengage then engage)', 1, function() {
        var iframe = createIframe('reengage', sameDomainEchoPath);

        postComm.disengage();
        postComm.engage();

        $(iframe).load(function() {
            comm = postComm.createIframeComm(iframe, function(message, comm) {
                clearTimeout(timeoutId);
                equal(message, 'message', 'Echo iframe returned expected message');
                start();
            });

            comm.sendMessage('message');
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of Re-Engage test, iframe did not load, Echo did not call postMessage, or engaging failed');
            start();
        }, 1000);
    });

}());