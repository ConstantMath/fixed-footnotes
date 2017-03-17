"use strict";

var inView = require("in-view");
var SR = require("scroll-resize");

/*
 * Start modifying the DOM by creating a fixed container and dynamically populate it.
 */
var FixedFootnotes = function(options = {}, w) {
  this.options = Object.assign({}, this.defaultOptions, options);
  this._window = w || window;

  this._fixedContainer = this._createFixedContainer();

  this._sr = new SR(this.refresh.bind(this));
  this._sr.start();
}

/*
 * Default options
 */
FixedFootnotes.prototype.defaultOptions = {
  // CSS selector used to identify the references in text.
  referencesSelector: ".footnote",

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
  this._sr.stop(true);
  this._fixedContainer.parentNode.removeChild(this._fixedContainer);
}

/*
 * Refresh the view.
 */
FixedFootnotes.prototype.refresh = function() {
  var self = this;
  util.emptyElement(this._fixedContainer);
  this._getReferences().forEach(function(reference) {
    self._displayIfVisible(reference);
  });
};

/*
 * From here: "private" methods that user is not supposed to call directly.
 */

/*
 * Create the fixed container that will host the footnotes.
 */
FixedFootnotes.prototype._createFixedContainer = function() {
  var fixedContainer = this._window.document.createElement("section");
  fixedContainer.id = this.options.fixedContainerId;
  fixedContainer.className = this.options.fixedContainerClass;
  this._window.document.querySelector(this.options.fixedContainerLocation).appendChild(fixedContainer);
  return fixedContainer;
}

/*
 * Get all the references.
 */
FixedFootnotes.prototype._getReferences = function() {
  return this._window.document.querySelectorAll(this.options.referencesSelector);
};

/*
 * Given a reference, display the footnote in the fixed container if the reference is on screen.
 * It won't display the footnote in the fixed container if the footnote is already on screen.
 */
FixedFootnotes.prototype._displayIfVisible = function(reference) {
  var note = this._window.document.querySelector(reference.getAttribute("href"));
  if (inView.is(reference) && !inView.is(note)) {
    this._displayNote(note);
  }
};

/*
 * Add a footnote to the fixed container.
 */
FixedFootnotes.prototype._displayNote = function(note) {
  var newNote = note.cloneNode(true);
  util.removeAllIds(newNote); // we don't want duplicate ids
  newNote.className += (" " + this.options.footnoteClass);
  newNote = this.options.transformNote(newNote);
  this._fixedContainer.appendChild(newNote);
};

var util = {

  /*
   * Remove all children from an element
   */
  emptyElement: function(element) {
    var node;
    while ((node = element.lastChild)) element.removeChild(node);
  },

  /*
   * Remove id of this element and its children.
   */
  removeAllIds: function (node) {
    node.id = "";
    var children = node.getElementsByTagName('*');
    for (var i = 0; i < children.length; i++) {
      children[i].id = "";
    }
  }
}

/*
 * Expose a single function that will instanciate a FixedFootnotes.
 */
module.exports = function(options, w) {
  return new FixedFootnotes(options, w);
};
