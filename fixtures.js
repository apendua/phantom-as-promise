window.emit = function emit() {
  if (window.callPhantom) {
    window.callPhantom(JSON.stringify(Array.prototype.slice.call(arguments, 0)));
  }
};
