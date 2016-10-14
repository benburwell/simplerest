var chalk = require('chalk');

var fmt = function(message) {
	return chalk.blue('[' + new Date() + ']') + ' ' + message;
};

module.exports = {
	info: function() {
		var msg = chalk.white.apply(null, arguments);
		console.log(fmt(msg));
	},
	error: function() {
		var msg = chalk.red.apply(null, arguments);
		console.error(fmt(msg));
	},
	debug: function() {
		var msg = chalk.dim.apply(null, arguments);
		console.log(fmt(msg));
	},
	warn: function() {
		var msg = chalk.yellow.apply(null, arguments);
		console.log(fmt(msg));
	}
};

