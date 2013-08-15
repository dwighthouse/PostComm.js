(function() {

    module('Comm object', {
        setup: function() {
            PostComm.engage();
        },
        teardown: function() {
            PostComm.disengage();
        }
    });

    asyncTest('Maintains state', 3, function() {
        var iframe = createIframe('messageHandler', 'Testing.Echo.html');

        var myOrigin = PostComm.convertUrlToOrigin(iframe.src);
        var myContentWindow;
        var myHandler = function() {};

        $(iframe).load(function() {
            clearTimeout(timeoutId);

            myContentWindow = iframe.contentWindow;

            var comm = PostComm.createIframeComm(iframe, myHandler);

            equal(comm.getOrigin(), myOrigin, 'Comm has the correct origin');
            equal(comm.getContentWindow(), myContentWindow, 'Comm has the correct contentWindow');
            equal(comm.getMessageHandler(), myHandler, 'Comm has the correct messageHandler');

            start();

            comm.destroy();
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of messageHandler test, iframe did not load');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            ok(false, 'Ignore this failure (ensures qunit consistency)');
            start();
        }, 1000);
    });

    asyncTest('IsValid check (bad origin)', 1, function() {
        var iframe = createIframe('BadOrigin', 'Testing.Echo.html');

        $(iframe).load(function() {
            clearTimeout(timeoutId);
            var comm = PostComm.createComm(PostComm.convertUrlToOrigin('asdf'), iframe.contentWindow, function() {});
            ok(!comm.isValid(), 'PostComm Object is not valid with bad origin');
            start();
            comm.destroy();
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of bad origin test, iframe did not load');
            start();
        }, 1000);
    });

    test('isValid check (bad contentWindow)', 1, function() {
        var comm = PostComm.createComm(PostComm.convertUrlToOrigin('http://google.com/'), null, function() {});
        ok(!comm.isValid(), 'PostComm Object is not valid with bad contentWindow');
        comm.destroy();
    });

    asyncTest('isValid check (good origin and contentWindow)', 1, function() {
        var iframe = createIframe('GoodOriginAndContentWindow', 'Testing.Echo.html');

        $(iframe).load(function() {
            clearTimeout(timeoutId);
            var comm = PostComm.createIframeComm(iframe, function() {});
            ok(comm.isValid(), 'PostComm Object is valid with good origin and contentWindow');
            start();
            comm.destroy();
        });

        var timeoutId = setTimeout(function() {
            ok(false, 'Bailed out of isValid test, iframe did not load');
            start();
        }, 1000);
    });

}());