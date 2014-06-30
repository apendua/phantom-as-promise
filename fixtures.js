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
      if (window.$ !== undefined) {
        el = $(el).get(0);
      } else {
        if (el[0] === '#') {
          el = document.getElementById(el.substr(1));
        } else {
          throw new TypeError("When jQuery isn't installed, you're limited to selectors in the #id form!")
        }
      }
    }
    if (window.$ !== undefined && el instanceof window.$) {
      el = $(el).get(0);
    }
    if (!el) {
      if (force) throw new Error(el + 'not found');
      return;
    }
    if (!document){
      document = window.document;
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
