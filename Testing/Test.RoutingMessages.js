(function() {

    var comm1, comm2;

    module('Routing messages', {
        setup: function() {
            PostComm.engage();
        },
        teardown: function() {
            if (comm1)
            {
                comm1.destroy();
            }
            if (comm2)
            {
                comm2.destroy();
            }
            PostComm.disengage();
        }
    });

    asyncTest('Same origin, different sources, correct routing', 2, function() {
        var iframe1 = createIframe('Frame1', 'Testing.Echo.html');
        var iframe2 = createIframe('Frame2', 'Testing.Echo.html');
        var comm1;
        var comm2;
        var loadCount = 0;
        var messageCount = 0;
        var message1 = 'not message 1';
        var message2 = 'not message 2';

        function frame1Handler(message, comm) {
            messageCount += 1;
            message1 = message;
            messageReceived();
        }

        function frame2Handler(message, comm) {
            messageCount += 1;
            message2 = message;
            messageReceived();
        }

        function messageReceived() {
            if (messageCount < 2)
            {
                return;
            }

            equal(message1, 'message1', 'Correctly routed first comm message');
            equal(message2, 'message2', 'Correctly routed second comm message');
            
            clearTimeout(timeoutId);

            start();
        }

        function iframeLoaded() {
            loadCount += 1;

            if (loadCount < 2)
            {
                return;
            }

            comm1 = PostComm.createIframeComm(iframe1, frame1Handler);
            comm2 = PostComm.createIframeComm(iframe2, frame2Handler);

            comm1.sendMessage('message1');
            comm2.sendMessage('message2');
        }

        $(iframe1).load(function() {
            iframeLoaded();
        });

        $(iframe2).load(function() {
            iframeLoaded();
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of finding test, iframe(s) did not load or message(s) did not transmit correctly');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            start();
        }, 1000);
    });

    asyncTest('Different origins, different sources, correct routing', 2, function() {
        var iframe1 = createIframe('Frame1', (otherDomainPath + 'Testing.Echo.html'));
        var iframe2 = createIframe('Frame2', 'Testing.Echo.html');
        var comm1;
        var comm2;
        var loadCount = 0;
        var messageCount = 0;
        var message1 = 'not message 1';
        var message2 = 'not message 2';

        function frame1Handler(message, comm) {
            messageCount += 1;
            message1 = message;
            messageReceived();
        }

        function frame2Handler(message, comm) {
            messageCount += 1;
            message2 = message;
            messageReceived();
        }

        function messageReceived() {
            if (messageCount < 2)
            {
                return;
            }

            equal(message1, 'message1', 'Correctly routed first comm message');
            equal(message2, 'message2', 'Correctly routed second comm message');
            
            clearTimeout(timeoutId);

            start();
        }

        function iframeLoaded() {
            loadCount += 1;

            if (loadCount < 2)
            {
                return;
            }

            comm1 = PostComm.createIframeComm(iframe1, frame1Handler);
            comm2 = PostComm.createIframeComm(iframe2, frame2Handler);

            comm1.sendMessage('message1');
            comm2.sendMessage('message2');
        }

        $(iframe1).load(function() {
            iframeLoaded();
        });

        $(iframe2).load(function() {
            iframeLoaded();
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of finding test, iframe(s) did not load or message(s) did not transmit correctly');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            start();
        }, 2000);
    });

}());