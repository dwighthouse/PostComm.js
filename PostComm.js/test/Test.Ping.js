(function() {

    module('Pinging', {
        setup: function() {
        },
        teardown: function() {
        }
    });

    asyncTest('Same domain iFrame pinging', 1, function() {
        var iframe = createIframe('samedomainiframepinging', sameDomainChildPath),
            comm = postComm.createIframeComm(iframe, function() {}),
            timeoutId;

        function pingSuccess(comm) {
            clearInterval(timeoutId);
            ok(true, 'iframe responded to ping, as expected');
            start();
        }

        function pingFailure(comm) {
            clearInterval(timeoutId);
            ok(false, 'iframe failed to respond to ping after trying multiple times');
            start();
        }

        timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of test, took too long to respond to ping');
            start();
        }, 2000);

        comm.ping(pingSuccess, pingFailure);
    });

    if (!skipWindowTests)
    {
        asyncTest('Same domain window pinging', 1, function() {
            var childWindow = createWindow('samedomainwindowpinging', sameDomainChildPath),
                comm = postComm.createComm(sameDomainChildPath, childWindow, function() {}),
                timeoutId;

            function pingSuccess(comm) {
                clearTimeout(timeoutId);
                ok(true, 'Child window responded to ping, as expected');
                start();
                childWindow.close();
            }

            function pingFailure(comm) {
                clearTimeout(timeoutId);
                ok(false, 'Child window failed to respond to ping after trying multiple times');
                start();
                childWindow.close();
            }

            timeoutId = setTimeout(function() {
                ok(false, 'Bailed out of test, took too long to respond to ping');
                start();
                childWindow.close();
            }, 2000);

            comm.ping(pingSuccess, pingFailure);
        });
    }

    asyncTest('Cross domain iFrame pinging', 1, function() {
        var iframe = createIframe('crossdomainiframepinging', crossDomainChildPath),
            comm = postComm.createIframeComm(iframe, function() {}),
            timeoutId;

        function pingSuccess(comm) {
            clearTimeout(timeoutId);
            ok(true, 'iframe responded to ping, as expected');
            start();
        }

        function pingFailure(comm) {
            clearTimeout(timeoutId);
            ok(false, 'iframe failed to respond to ping after trying multiple times');
            start();
        }

        timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of test, took too long to respond to ping');
            start();
        }, 2000);

        comm.ping(pingSuccess, pingFailure);
    });

    if (!skipWindowTests)
    {
        asyncTest('Cross domain window pinging', 1, function() {
            var childWindow = createWindow('crossdomainwindowpinging', crossDomainChildPath),
                comm = postComm.createComm(crossDomainChildPath, childWindow, function() {}),
                timeoutId;

            function pingSuccess(comm) {
                clearTimeout(timeoutId);
                ok(true, 'Child window responded to ping, as expected');
                start();
                childWindow.close();
            }

            function pingFailure(comm) {
                clearTimeout(timeoutId);
                ok(false, 'Child window failed to respond to ping after trying multiple times');
                start();
                childWindow.close();
            }

            timeoutId = setTimeout(function() {
                ok(false, 'Bailed out of test, took too long to respond to ping');
                start();
                childWindow.close();
            }, 2000);

            comm.ping(pingSuccess, pingFailure);
        });
    }

    function handleChildPingResponse(message) {
        if (message === 'ping-success')
        {
            ok(true, 'Child was able to successfully ping the parent');
        }
        else if (message === 'ping-failure')
        {
            ok(false, 'Child was able to successfully ping the parent');
        }
        else
        {
            ok(false, 'Unrecognized message was sent from ping child helper');
        }

        start();
    }

    function handleBailOut() {
        ok(false, 'Bailed out of test, took too long to respond to ping');
        start();
    }

    asyncTest('Same domain child iframe pinging parent', 1, function() {
        var iframe = createIframe('samedomainchildiframepingingparent', sameDomainChildPingPath),
            comm = postComm.createIframeComm(iframe, callback),
            timeoutId;

        function callback(message) {
            clearTimeout(timeoutId);
            handleChildPingResponse(message);
        }

        timeoutId = setTimeout(function() {
            handleBailOut();
        }, 3000);
    });

    if (!skipWindowTests)
    {
        asyncTest('Same domain child window pinging parent', 1, function() {
            var childWindow = createWindow('samedomainchildwindowpingingparent', sameDomainChildPingPath),
                comm = postComm.createComm(sameDomainChildPingPath, childWindow, callback),
                timeoutId;

            function callback(message) {
                clearTimeout(timeoutId);
                handleChildPingResponse(message);
                childWindow.close();
            }

            timeoutId = setTimeout(function() {
                handleBailOut();
                childWindow.close();
            }, 3000);
        });
    }

    asyncTest('Cross domain child iframe pinging parent', 1, function() {
        var iframe = createIframe('crossdomainchildiframepingingparent', crossDomainChildPingPath),
            comm = postComm.createIframeComm(iframe, callback),
            timeoutId;

        function callback(message) {
            clearTimeout(timeoutId);
            handleChildPingResponse(message);
        }

        timeoutId = setTimeout(function() {
            handleBailOut();
        }, 3000);
    });

    if (!skipWindowTests)
    {
        asyncTest('Cross domain child window pinging parent', 1, function() {
            var childWindow = createWindow('crossdomainchildwindowpingingparent', crossDomainChildPingPath),
                comm = postComm.createComm(crossDomainChildPingPath, childWindow, callback),
                timeoutId;

            function callback(message) {
                clearTimeout(timeoutId);
                handleChildPingResponse(message);
                childWindow.close();
            }

            timeoutId = setTimeout(function() {
                handleBailOut();
                childWindow.close();
            }, 3000);
        });
    }

    asyncTest('Setting isConnected() status just by recieving ping', 2, function() {
        var iframe = createIframe('isconnectedstatusonping', sameDomainChildPingPath2),
            comm = postComm.createIframeComm(iframe, function() {}),
            initialConnectedStatus = comm.isConnected();

        setTimeout(function() {
            var finalConnectedStatus = comm.isConnected();

            equal(initialConnectedStatus, false, 'comm correctly not connected when recently created');
            equal(finalConnectedStatus, true, 'comm correctly connected after ping fired from child');

            start();
        }, 1500);
    });

    asyncTest('Setting isConnected() status just by recieving message (not ping)', 2, function() {
        var iframe = createIframe('isconnectedstatusonmessage', sameDomainEchoPath),
            comm = postComm.createIframeComm(iframe, callback),
            initialConnectedStatus = comm.isConnected(),
            finalConnectedStatus,
            timeoutId;

        function callback(message) {
            clearTimeout(timeoutId);

            finalConnectedStatus = comm.isConnected();

            equal(initialConnectedStatus, false, 'comm correctly not connected when recently created');
            equal(finalConnectedStatus, true, 'comm correctly connected message received from child');

            start();
        }

        timeoutId = setTimeout(function() {
            var finalConnectedStatus = comm.isConnected();

            ok(false, 'Bailed out of test, took too long to receive message from child');
            ok(false, 'Ignore this failure (ensures qunit consistency)');

            start();
        }, 2000);

        setTimeout(function() {
            comm.sendMessage('message');
        }, 1000);
    });

}());