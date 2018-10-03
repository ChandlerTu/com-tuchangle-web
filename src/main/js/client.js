'use strict';

var rest = require('rest');
var mime = require('rest/interceptor/mime');

var baseRegistry = require('rest/mime/registry');
var registry = baseRegistry.child();
registry.register('text/uri-list', require('./api/uriListConverter'));
registry.register('application/hal+json', require('rest/mime/type/application/hal'));

var uriTemplateInterceptor = require('./api/uriTemplateInterceptor');
var errorCode = require('rest/interceptor/errorCode');
var defaultRequest = require('rest/interceptor/defaultRequest');

module.exports = rest
		.wrap(mime, { registry: registry })
		.wrap(uriTemplateInterceptor)
		.wrap(errorCode)
		.wrap(defaultRequest, { headers: { 'Accept': 'application/hal+json' }});
