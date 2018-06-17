// 处理函数：处理promise2和x的关系
function resolvePromise(promise2, x, resolve, reject) {
	// 判断x是不是promise
	// promiseA+规范2.3
	if (promise2 === x) {
		return reject(new TypeError('循环引用'))
	}
	let called // 防止成功后在调用失败
	if (x !== null && (typeof x === 'object') || typeof x === 'function') {
		try {
			let then = x.then
			// 如果then是一个函数，认定x是promise
			if (typeof then === 'function') {
				// call的第一个参数是this，后面是成功回调和失败回调
				then.call(x, y => {
					if (called) return
					called = true
					// 此时又出现then函数参数函数执行结果是否是promise的情况，固递归调用resolvePromise
					resolvePromise(promise2, y, resolve, reject)
				}, r => {
					if (called) return
					called = true
					// 如果失败，则直接失败处理
					reject(r)
				})
			} else {
				// 此时x是值,直接成功即可
				resolve(x)
			}
		} catch (e) {
			if (called) return
			called = true
			reject(e)
		}
	} else {
		// 此时x是单纯的值,直接成功即可
		resolve(x)
	}
}
class Promise {
	constructor(executor) {
		// 默认的状态
		this.status = 'pending'
		// 原因
		this.value = undefined
		this.reason = undefined
		// 成功存放的数组
		this.onResolvedCallbacks = []
		// 失败的数组
		this.onRejectedCallbacks = []
		let resolve = (value) => {
			if (this.status === 'pending') {
				this.status = 'resolved'
				this.value = value
				this.onResolvedCallbacks.forEach(fn => fn())
			}
		}
		let reject = (reason) => {
			if (this.status === 'pending') {
				this.status = 'rejected'
				this.reason = reason
				this.onRejectedCallbacks.forEach(fn => fn())
			}
		}
		// 默认让执行器执行
		executor(resolve, reject)
	}
	then(onFulfilled, onRejected) {
		// 穿透 .then().then()
		onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
		onRejected = typeof onRejected === 'function' ? onRejected : err => {
			throw err
		}
		let promise2
		if (this.status === 'resolved') {
			promise2 = new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						let x = onFulfilled(this.value)
						// 如果x是promise，取x的结果作为promise2的返回结果
						// 如果x是普通值，取x值作为promise2的返回值
						// promise2是第一次then返回的对象
						// x是第一次promise函数参数函数(onFulFilled, onRejected)执行结果
						resolvePromise(promise2, x, resolve, reject)
					} catch (e) {
						reject(e)
					}
				}, 0)
			})
		}
		if (this.status === 'rejected') {
			promise2 = new Promise((resolve, reject) => {
				setTimeout(() => {
					try {
						let x = onRejected(this.reason)
						resolvePromise(promise2, x, resolve, reject)
					} catch (e) {
						reject(e)
					}
				}, 0)
			})
		}
		if (this.status === 'pending') {
			promise2 = new Promise((resolve, reject) => {
				// 存放成功回调
				this.onResolvedCallbacks.push(() => {
					setTimeout(() => {
						try {
							let x = onFulfilled(this.value)
							resolvePromise(promise2, x, resolve, reject)
						} catch (e) {
							reject(e)
						}
					}, 0)
				})
				// 存放失败回调
				this.onRejectedCallbacks.push(() => {
					setTimeout(() => {
						try {
							let x = onRejected(this.reason)
							resolvePromise(promise2, x, resolve, reject)
						} catch (e) {
							reject(e)
						}
					}, 0)
				})
			})
		}
		return promise2
	}
	catch (onRejected) {
		// catch 就是then函数参数onFulFilled为null的情况
		return this.then(null, onRejected)
	}
}

// promise语法糖
Promise.deferred = Promise.defer = function () {
	let dfd = {}
	dfd.promise = new Promise((resolve, reject) => {
		dfd.resolve = resolve
		dfd.reject = reject
	})
	return dfd
}

Promise.resolve = (val) => {
	return new Promise((resolve, reject) => resolve(val))
}

Promise.reject = (val) => {
	// reject() 后下一次then是fulfilled
	return new Promise((resolve, reject) => resolve(val))
}

Promise.all = (promises) => {
	return new Promise((resolve, reject) => {
		let arr = []
		// count变量是为了保证所有promise都成功设置的索引
		let count = 0
		// index参数是为保证promises执行结果按顺序返回
		function processData(index, data) {
			arr[index] = data
			count++
			if (count === promises.length) {
				resolve(arr)
			}
		}
		for (let i = 0; i < promises.length; i++) {
			promises[i].then(data => {
				processData(i, data)
			}, reject)
		}
	})
}

Promise.race = (promises) => {
	return new Promise((resolve, reject) => {
		for (let i = 0; i < promises.length; i++) {
			promises[i].then(resolve, reject)
		}
	})
}

Promise.promisify = (fn) => {
	return function (...args) {
		return new Promise((resolve, reject) => {
			fn(...args, (err, data) => {
				if (err) reject(err)
				resolve(data)
			})
		})
	}
}

module.exports = Promise