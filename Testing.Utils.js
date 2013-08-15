// Helper Stuff
function typeOf(value) {
    var s = typeof value;

    return (s !== 'object')         ? s :
           (!value)                 ? 'null' :
           (value instanceof Array) ? 'array' : 'object';
}

function createWindow(id, url) {
    return window.open(url, id, 'height=200,width=200');
}

function createIframe(id, url) {
    $('#qunit-fixture').append('<iframe id="LocalIframe-' + id + '" src="' + url + '"></iframe>');
    return $(('#LocalIframe-' + id))[0];
}