(function() {

    var comm;

    module('Destroyed comms', {
        setup: function() {

        },
        teardown: function() {
            if (comm)
            {
                comm.destroy();
            }
        }
    });

    asyncTest('Destroyed comm changes state correctly', 9, function() {
        var iframe = createIframe('destroyable', sameDomainEchoPath);

        var myOrigin = convertUrlToOrigin(iframe.src);
        var myContentWindow;
        var myHandler = function() {};

        $(iframe).load(function() {
            clearTimeout(timeoutId);

            myContentWindow = iframe.contentWindow;

            comm = postComm.createIframeComm(iframe, myHandler);

            var destroyFunction = comm.destroy;

            equal(comm.getOrigin(), myOrigin, 'Pre-destroyed comm has the correct origin');
            equal(comm.getContentWindow(), myContentWindow, 'Pre-destroyed comm has the correct contentWindow');
            equal(comm.getMessageHandler(), myHandler, 'Pre-destroyed comm has the correct messageHandler');
            ok(comm.isValid(), 'Pre-destroyed comm is valid');

            comm.destroy();

            equal(comm.getOrigin(), undefined, 'Destroyed comm has an undefined origin');
            equal(comm.getContentWindow(), undefined, 'Destroyed comm has an undefined contentWindow');
            notEqual(comm.getMessageHandler(), myHandler, 'Destroyed comm has a different messageHandler');
            ok(!comm.isValid(), 'Destroyed comm is not valid');
            notEqual(comm.destroy, destroyFunction, 'Destroyed comm\'s destroy function changed');

            start();
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of destroyed comm test, iframe did not load');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            start();
        }, 1000);
    });

    asyncTest('Destroyed comm does not listen', 2, function() {
        var iframe = createIframe('destroyable', sameDomainEchoPath);

        function receiveMessage(message, comm) {
            if (message === 'message1')
            {
                clearTimeout(timeoutId1);
                equal(message, 'message1', 'Echo iframe returned expected message on undestroyed comm');

                comm.destroy();
                comm.sendMessage('message2');
            }
            else
            {
                ok(false, 'Received message from a destroyed comm, which is not expected');
            }
        }

        $(iframe).load(function() {
            comm = postComm.createIframeComm(iframe, receiveMessage);

            comm.sendMessage('message1');
        });

        var timeoutId1 = setTimeout(function() {
            ok(false, 'Bailed out of destroyed comm test, iframe did not load or Echo did not call postMessage');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            start();
        }, 1000);

        var timeoutId2 = setTimeout(function() {
            ok(true, 'Destroyed comm did not hear message');
            start();
        }, 1000);
    });

}());