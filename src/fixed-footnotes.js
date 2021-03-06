"use strict";

var util = require("./util");
var throttle = require("lodash/throttle");

/*
 * Start modifying the DOM by creating a fixed container and dynamically populate it.
 */
var FixedFootnotes = function(options, w) {
  this.options = Object.assign({}, this.defaultOptions, options);
  this._window = w || window;

  var fixedContainer = this._createFixedContainer();
  this._fixedContainer = fixedContainer;
  this._fixedContainerList = fixedContainer.firstChild;
  this._refreshListeners = [];

  // throttle of the refresh event to improve performances
  this._eventListener = throttle(this.refresh.bind(this), 200);
  this._window.addEventListener("scroll", this._eventListener);
  this._window.addEventListener("resize", this._eventListener);
  this._refreshView();
}

/*
 * Default options
 */
FixedFootnotes.prototype.defaultOptions = {
  // CSS selector used to identify the references in text.
  referencesSelector: ".reference",

  // CSS selector to the node that will host the fixed container.
  fixedContainerLocation: "body",

  // Id to set to the fixed container.
  fixedContainerId: "",

  // Class to set to the fixed container.
  fixedContainerClass: "fixed-footnotes-container",

  // Class to add to the footnotes in the container.
  footnoteClass: "fixed-footnotes-note",

  // Override this if you want to modify your note before displaying it in the fixed container
  transformNote: function(elem) { return elem; }
};

/*
 * Stop all the things we were doing and put back the DOM at its initial state.
 */
FixedFootnotes.prototype.stop = function() {
  this._window.removeEventListener("scroll", this._eventListener);
  this._window.removeEventListener("resize", this._eventListener);
  this._fixedContainer.parentNode.removeChild(this._fixedContainer);
}

/*
 * Refresh the view.
 */
FixedFootnotes.prototype.refresh = function() {
  this._refreshView();
};

/*
 * Add a listener to every refresh events
 */
FixedFootnotes.prototype.addRefreshListener = function(listener) {
  if (!listener || typeof listener !== 'function') {
    console.log('[FixedFootnotes] Attempt to add an illegal listener to refreshes');
    return;
  }
  this._refreshListeners.push(listener);
};

/*
 * Remove previously subscribed event handler
 */
FixedFootnotes.prototype.removeRefreshListener = function(listener) {
  if (!listener || typeof listener !== 'function') {
    console.log('[FixedFootnotes] Attempt to remove an illegal listener to refreshes');
    return;
  }
  const index = this._refreshListeners.indexOf(listener);
  if (index > -1) {
    this._refreshListeners.splice(index, 1);
  } else {
    console.log('[FixedFootnotes] Attempt to remove listener failed: already removed');
  }
};

/*
 * From here: "private" methods that user is not supposed to call directly.
 */

/*
 * Create the fixed container that will host the footnotes.
 */
FixedFootnotes.prototype._createFixedContainer = function() {
  var fixedContainer = this._window.document.createElement("div");
  fixedContainer.id = this.options.fixedContainerId;
  fixedContainer.className = this.options.fixedContainerClass + " fixed-footnotes-empty";
  fixedContainer.appendChild(this._window.document.createElement("ul"));
  this._window.document.querySelector(this.options.fixedContainerLocation).appendChild(fixedContainer);
  return fixedContainer;
}

/*
 * Refresh the view.
 */
FixedFootnotes.prototype._refreshView = function() {
  var self = this;
  util.emptyElement(this._fixedContainerList);
  var containerEmpty = true;
  this._getReferences().forEach(function(reference) {
    var note = self._getNoteFromRef(reference);
    if (self._shouldDisplayNoteFor(reference, note)) {
      self._displayNote(note);
      containerEmpty = false;
    }
  });
  if (containerEmpty) {
    this._fixedContainer.classList.add("fixed-footnotes-empty");
  } else {
    this._fixedContainer.classList.remove("fixed-footnotes-empty");
  }
  this._dispatchRefresh();
};

/*
 * Get all the references.
 */
FixedFootnotes.prototype._getReferences = function() {
  return this._window.document.querySelectorAll(this.options.referencesSelector);
};

/*
 * Return true if we should display the note of the given reference.
 * Note must exist, reference must be visible, and original note must not be visible.
 */
FixedFootnotes.prototype._shouldDisplayNoteFor = function(reference, note) {
  return note != undefined &&
    util.isElementInViewport(reference, this._window) &&
    !util.isElementInViewport(note, this._window);
};

/*
 * Given a reference, find its footnote.
 */
FixedFootnotes.prototype._getNoteFromRef = function(reference) {
  var href = reference.getAttribute("href");
  var id = href.substring(href.indexOf("#") + 1);
  return this._window.document.getElementById(id);
}

/*
 * Add a footnote to the fixed container.
 */
FixedFootnotes.prototype._displayNote = function(note) {
  var li = this._window.document.createElement("li");
  li.className = this.options.footnoteClass;
  li.innerHTML = note.innerHTML;
  util.removeAllIds(li); // we don't want duplicate ids
  li = this.options.transformNote(li);
  this._fixedContainerList.appendChild(li);
};

/*
 * Use requestAnimationFrame to assure that the refresh event is dispatched
 * after the DOM is actually generated.
 */
FixedFootnotes.prototype._dispatchRefresh = function() {
  const listeners = this._refreshListeners;
  const nextFrame = this._window.requestAnimationFrame || function(fn) {
    setTimeout(fn, 10);
  };
  nextFrame(function() {
    listeners.forEach(function(listener) {
      listener();
    });
  });
};

/*
 * Expose a single function that will instanciate a FixedFootnotes.
 */
module.exports = function(options, w) {
  return new FixedFootnotes(options, w);
};
