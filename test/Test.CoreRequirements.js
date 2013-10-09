(function() {

    module('Core requirements');

    test('Browser/environment is capable of postMessage', function() {
        equal(typeOf(window.postMessage), 'function', 'Browser/environment does have postMessage function');
    });

    test('postComm added to global namespace', function() {
        equal(typeOf(window.postComm), 'object', 'postComm detected in global namespace');
    });

    test('noConflict removes PostComm from global namespace', function() {
        var api = window.postComm;
        window.postComm.noConflict();
        equal(window.postComm, undefined, 'postComm not detected in global namespace');

        window.postComm = api;
    });

}());