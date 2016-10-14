var connect = require('connect');
var compression = require('compression');
var http = require('http');
var bodyParser = require('body-parser');

var log = require('./log');

// takes /people/1/books/3/author and returns {
//   entity: 'people',
//   id: '1',
//   rest: [ 'books', '3', 'author' ]
// }
var readurl = function(url) {
	var parts = url.split('/');
	if (parts.length === 0) {
		log.debug('malformed url', url);
		throw new Error('Malformed URL');
	}

	// remove first empty section from preceeding /
	parts.shift();

	return {
		resource: parts.shift(),
		id: parts.shift(),
		rest: parts
	};
};

// validate an item if possible
var validate = function(model, item) {
	if (typeof item !== 'object') {
		return false;
	}
	if (typeof model.validate === 'function') {
		return model.validate(item);
	}
	return true;
};

var validateAll = function(model, items) {
	if (!Array.isArray(items)) {
		return false;
	}
	for (var idx = 0; idx < items.length; idx++) {
		if (!validate(model, items[idx])) {
			return false;
		}
	}
	return true;
};

var SimpleREST = function() {
	var me = this;
	me.models = {};

	me.app = connect();
	me.app.use(compression());
	me.app.use(bodyParser.json());
	me.app.use(function(req, res) {
		log.info(req.method, req.url);
		var route = readurl(req.url);
		if (typeof route.resource === 'undefined') {
			me.status404(res);
		} else {
			me.handleResourceRequest(route, req, res);
		}
	});

	me.status404 = function(res) {
		res.writeHead(404);
		res.end();
	};

	me.handleResourceRequest = function(route, req, res) {
		if (!me.models.hasOwnProperty(route.resource)) {
			return me.status404(res);
		}

		var model = me.models[route.resource];
		var hasId = typeof route.id !== 'undefined';

		if (req.method === 'GET') {
			if (hasId) {
				// get instance
				if (typeof model.get === 'function') {
					model.get(route.id).then(function(result) {
						res.writeHead(200, {
							'Content-Type': 'application/json'
						});
						res.end(JSON.stringify(result));
					}).catch(function(err) {
						res.writeHead(500);
						res.end();
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			} else {
				// get collection
				if (typeof model.all === 'function') {
					model.all().then(function(result) {
						res.writeHead(200, {
							'Content-Type': 'application/json'
						});
						res.end(JSON.stringify(result));
					}).catch(function(err) {
						res.writeHead(500);
						res.end();
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			}
		} else if (req.method === 'POST') {
			if (hasId) {
				// append to instance...?
				res.writeHead(501);
				res.end();
			} else {
				// add to collection
				if (typeof model.create === 'function') {
					if (validate(model, req.body)) {
						model.create(req.body).then(function(result) {
							res.writeHead(201, {
								'Content-Type': 'application/json'
							});
							res.end(JSON.stringify(result));
						}).catch(function(err) {
							res.writeHead(500);
							res.end();
						});
					} else {
						res.writeHead(400);
						res.end();
					}
				} else {
					res.writeHead(404);
					res.end();
				}
			}
		} else if (req.method === 'PUT') {
			if (hasId) {
				if (typeof model.replace === 'function') {
					if (validate(model, req.body)) {
						model.replace(route.id, req.body).then(function(result) {
							res.writeHead(200, {
								'Content-Type': 'application/json'
							});
							res.end(JSON.stringify(result));
						}).catch(function(err) {
							res.writeHead(500);
							res.end();
						});
					} else {
						res.writeHead(400);
						res.end();
					}
				} else {
					res.writeHead(404);
					res.end();
				}
			} else {
				// replace collection
				if (typeof model.replaceAll === 'function') {
					if (validateAll(model, req.body)) {
						model.replaceAll(req.body).then(function(result) {
							res.writeHead(200, {
								'Content-Type': 'application/json'
							});
							res.end(JSON.stringify(result));
						}).catch(function(err) {
							res.writeHead(500);
							res.end();
						});
					} else {
						res.writeHead(400);
						res.end();
					}
				} else {
					res.writeHead(404);
					res.end();
				}
			}
		} else if (req.method === 'PATCH') {
			if (hasId) {
				// update partial
				res.writeHead(501);
				res.end();
			} else {
				// ???
				res.writeHead(501);
				res.end();
			}
		} else if (req.method === 'DELETE') {
			if (hasId) {
				// delete a resource
				if (typeof model.remove === 'function') {
					model.remove(route.id).then(function() {
						res.writeHead(204);
						res.end();
					}).catch(function(err) {
						res.writeHead(500);
						res.end();
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			} else {
				// clear the collection
				if (typeof model.clear === 'function') {
					model.clear().then(function() {
						model.writeHead(200, {
							'Content-Type': 'application/json'
						});
						model.end(JSON.stringify([]));
					}).catch(function(err) {
						res.writeHead(500);
						res.end();
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			}
		} else {
			res.writeHead(404);
			res.end();
		}
	};
};

SimpleREST.prototype.model = function(modelName, options) {
	this.models[modelName] = options;
};

SimpleREST.prototype.serve = function(port) {
	if (typeof port !== 'undefined') {
		http.createServer(this.app).listen(port);
		return true;
	}
	if ('' + process.env.PORT !== '') {
		http.createServer(this.app).listen(process.env.PORT);
		return true;
	}
	throw new Error('No port was specified, and none found in environment');
};

module.exports = SimpleREST;
