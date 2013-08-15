(function() {

    var comm;

    module('Engage and disengage', {
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

    asyncTest('Disengage', 1, function() {
        var iframe = createIframe('disengage', 'Test.Echo.html'),
            defaultMessage = 'not message';

        PostComm.disengage();

        $(iframe).load(function() {
            comm = PostComm.createIframeComm(iframe, function(message, comm) {
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
        var iframe = createIframe('reengage', 'Test.Echo.html');

        PostComm.disengage();
        PostComm.engage();

        $(iframe).load(function() {
            comm = PostComm.createIframeComm(iframe, function(message, comm) {
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