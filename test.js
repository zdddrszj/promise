let Promise = require('./index.js')
let fs = require('fs')

function read(path) {
	let defer = Promise.defer()
	fs.readFile(path, 'utf8', (err, data) => {
		if (err) defer.reject(err)
		defer.resolve(data)
	})
	return defer.promise
}

Promise.all([
		read('./data/1.txt'),
		read('./data/2.txt')
	])
	.then(data => {
		console.log(data)
	})

let read1 = Promise.promisify(fs.readFile)
read1('./data/1.txt', 'utf8')
	.then(data => {
		console.log(data)
	})
