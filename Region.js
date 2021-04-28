export default class Region {
	constructor (first, next, step=1) {
		Object.defineProperties(this,{
			first : {value: first},
			next  : {value: next },
			step  : {value: step },
		});

		if (next === undefined) {
			this.first = 0;
			this.next = first;
		}
	}

	* _getIter () {
		if (0 < this.step) 
			for (var i = this.first; i < this.next; i += this.step) 
				yield i;
		else if (this.step < 0)
			for (var i = this.first; i > this.next; i += this.step) 
				yield i;
		else if (this.step == 0)
			yield null;
	}

	get arr () {
		var 
			arr = [],
			iterator = this._getIter(),
			n = 0;
		for (var v of iterator) {
			arr[n] = v;
			n ++;
		}
		return arr;
	}

	get length () {
		if (0 < this.step) 
			return Math.floor((this.next - this.first) / this.step);
		else if (this.step < 0)
			return Math.floor((this.first - this.afer) / this.step);
		else if (this.step == 0)
			return Infinity;
	}

	includes (num) {
		if (0 < this.step) 
			return this.first <= num && num < this.next;
		else if (this.step < 0)
			return this.next <= num && num < this.first;
		else if (this.step == 0)
			return false;
	}
}