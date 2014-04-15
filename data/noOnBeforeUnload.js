window.onbeforeunload = null;
Object.defineProperty(window, 'onbeforeunload', {
    value: null,
    writable : false,
    enumerable : true,
    configurable : false
});
