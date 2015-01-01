"use strict";

/**
 * Generate full page html based off of html views
 *
 * @author Matt Ludwigs
 * @date 12/31/14
 */

var fs = require("fs"),
    childProcess = require("child_process"),
    events = require("events"),
    keys,
    layoutContent,
    viewsContent = [];

/**
 *
 * @returns {Array}
 */
function getKeys() {
  return keys;
}

/**
 *
 * @param obj {Object}
 */
function setKeys(obj) {
  keys = Object.keys(obj);
}

/**
 *
 * @param proto {Object}
 * @param literal {Object}
 * @returns {Object}
 */
function extend(proto, literal) {
  var result = Object.create(proto);
  Object.keys(literal).forEach(function(key) {
    result[key] = literal[key];
  });
  return result;
}

/**
 *
 * @param err {Object}
 * @param contents {Buffer}
 */
function storeFileContents(err, contents) {
  if (err) {
    console.log(err);
  }
  viewsContent.push(contents.toString());
  if (keys.length === viewsContent.length) {
    viewCompiler.emit("$viewsContentReady");
  }
}

/**
 * Writes to the file with the compiled html
 *
 * @param content {String}
 * @param dist {String}
 */
function writeFullHTML(content, dist) {
  fs.writeFile(dist, content, function (err) {
    if (err) {
      console.log(err);
    }

    console.log("File:", dist, "was written");
  });
}

/**
 * Remove the existing dist dir to provide a clean slate
 *
 * @param distDir {String}
 */
function removeExistingDistDir(distDir) {
  childProcess.exec("rm -rf " + __dirname + distDir, function (err) {
    if (err) {
      console.log(err);
    }

    console.log("[viewCompiler]: removing", distDir);
    viewCompiler.emit("$cleaned");
  });
}

var viewCompiler = extend(new events.EventEmitter(), {

  /**
   * Initialize and run
   *
   * @param opts {Object}
   */
  init: function (opts) {
    this.opts = opts;
    setKeys(this.opts.views);

    fs.readdir(__dirname, function (err, files) {
      if (err) {
        console.log(err.message);
      }

      var i;
      for (i = 0; i < files.length; i++) {
        if (files[i] === this.opts.layoutFile) {
          removeExistingDistDir(this.opts.dist);
        }
      }
    }.bind(this));
  },

  getKeys: getKeys,

  /**
   * Gets the views and stores them for later use
   */
  getViewsContent: function () {
    var i;

    for (i = 0; i < keys.length; i++) {
      fs.readFile(__dirname + keys[i], storeFileContents);
    }
  },

  /**
   * Compiles the full html file
   * from the views
   */
  compileFullHTML: function () {
    var i;

    for (i = 0; i < viewsContent.length; i++) {
      var fullContent = layoutContent.replace("<!-- @content -->", viewsContent[i]);
      writeFullHTML(fullContent, __dirname + this.opts.dist + this.opts.views[keys[i]]);
    }
  },

  /**
   * Read the layout file contents
   */
  readFileLayout: function () {
    fs.readFile(__dirname + "/" + this.opts.layoutFile, function (err, content) {
      if (err) {
        console.log(err.message);
      }
      layoutContent =  content.toString();
      this.emit("$layoutFileReady");
    }.bind(this));
  }

});



viewCompiler.init({
  layoutFile: "index.html",
  dist: "/examples",
  views: {
    "/out/views/design.html": "/design.html",
    "/out/views/content-wireframing.html": "/content-wireframing.html"
  }
});

viewCompiler.on("$cleaned", function () {
  this.readFileLayout();
});

viewCompiler.on("$layoutFileReady", function () {
  fs.mkdir(__dirname + this.opts.dist, function (err) {
    if (err) {
      console.log(err);
    }
    this.getViewsContent();
  }.bind(this));

});

viewCompiler.on("$viewsContentReady", function () {
  this.compileFullHTML();
});


