/* jshint node:true */
'use strict';

var util = require('util');
var path = require('path');
var chalk = require('chalk');
var gutil = require('gulp-util');
var through = require('through2');
var PluginError = gutil.PluginError;

module.exports = function(options) {
  options = options || {};

  function normalizeTemplateName(name) {
    return name.replace(/\\/g, '/');
  }

  function transform(file, encoding, next) {

    if(file.isNull()) {
      return next(null, file); // pass along
    }

    var name = path.relative(file.base, file.path);
    var pathPrefix = options.pathPrefix || '';
    var contents = file.contents.toString('utf8').replace(/\'/g, '\\\'').replace(/\r?\n/g, '\\n\' +\n  \'');
    var module = typeof options.module === 'function' ? options.module.call(file, name) : (options.module || 'ngTemplates');
    var standalone = options.standalone ? ', []' : '';
    var header = gutil.template(typeof options.header === 'string' ? options.header :'angular.module(\'<%= module %>\'<%= standalone %>).run([\'$templateCache\', function($templateCache) {', {module: module, standalone: standalone, file: ''});
    var content = gutil.template('  $templateCache.put(\'<%= name %>\', \'<%= contents %>\');', {name: normalizeTemplateName(pathPrefix + name), contents: contents, file: ''});
    var footer = typeof options.footer === 'string' ? options.footer : '}]);';
    
    var buffer = [];
    if(options.useStrict !== false) buffer.push('\'use strict\';');
    if(header.length) buffer.push(header);
    buffer.push(content);
    if(footer.length) buffer.push(footer);

    file.contents = new Buffer(buffer.join('\n\n'));
    file.path = gutil.replaceExtension(file.path, '.js');
    if(options.debug) gutil.log(util.format('File \'%s\' created.', chalk.cyan(path.relative(process.cwd(), file.path))));
    next(null, file);

  }

  return through.obj(transform);

};
