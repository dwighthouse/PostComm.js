(function() {

    module('Core requirements');

    test('Browser/environment is capable of postMessage', function() {
        equal(typeOf(window.postMessage), 'function', 'Browser/environment does have postMessage function');
    });

    test('PostComm added to global namespace', function() {
        equal(typeOf(window.PostComm), 'object', 'PostComm detected in global namespace');
    });

    test('noConflict removes PostComm from global namespace', function() {
        var api = window.PostComm;
        window.PostComm.noConflict();
        equal(window.PostComm, undefined, 'PostComm not detected in global namespace');

        window.PostComm = api;
    });

}());