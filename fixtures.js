if (!window.emit) {
  window.emit = function emit() {
    if (window.callPhantom) {
      window.callPhantom(JSON.stringify(Array.prototype.slice.call(arguments, 0)));
    }
  };
}

if (!window.click) {
  window.click = function (el, force) {
    if (typeof el === 'string') {
      el = document.querySelector(el);
    }
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
        "click",
        true /* bubble */, true /* cancelable */,
        window, null,
        0, 0, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    );
    el.dispatchEvent(ev);
  };
}
