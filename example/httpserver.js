var SimpleREST = require('../lib');

var api = new SimpleREST();

var people = [];
var nextPerson = 1;

api.model('person', {
	create: function(person) {
		return new Promise(function(resolve, reject) {
			people['' + nextPerson++] = person;
			resolve(person);
		});
	},
	read: function(id) {
		return new Promise(function(resolve, reject) {
			if (people.hasOwnProperty(id)) {
				resolve(people[id]);
			} else {
				reject('not found');
			}
		});
	},
	all: function() {
		return new Promise(function(resolve, reject) {
			resolve(people);
		});
	},
	validate: function(person) {
		return person.hasOwnProperty('name') && person.name.length > 0;
	}
});

var count = 0;
api.model('counter', {
	all: function() {
		return { count: ++count };
	}
});

api.serve(3000);

