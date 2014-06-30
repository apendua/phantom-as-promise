window.emit = function emit() {
  if (window.callPhantom) {
    window.callPhantom(Array.prototype.slice.call(arguments, 0));
  }
};
