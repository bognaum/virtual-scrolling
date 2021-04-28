function virtualScrolling(viewport, getLine, countOfAllLines, lineHeight) {
	var version = "0.2.0";

	const Region = _Region();

	
	var shell = document.createElement("div");

	var _ = {
		viewport,
		carriage : null,
		getViewHeight,
		countOfAllLines,
		lineHeight,
		dsLineNum : "virtualScrollingLineNum",
		getLine : function(num) {
			const lineEl = getLine(num);
			lineEl.dataset[_.dsLineNum] = num;
			return lineEl;
		},
		firstVisibleLineNum : 0,

	};

	_.allLinesHeight = _.countOfAllLines * _.lineHeight;
	_.lastLineNum = _.countOfAllLines - 1;

	_.viewport.dataset.virtual_scrollingVer = version;

	_.carriage = create(`
		<div
			class="carriage"
			style="
				margin-top: 0px;
				margin-bottom: ${_.lineHeight * _.countOfAllLines}px;
			"
		></div>
	`);

	_.viewport.appendChild(_.carriage);
	_.viewport.addEventListener("scroll", function(e) {
		render(this.scrollTop);
	}, false);
	window.addEventListener("resize", function(e) {
		render(_.viewport.scrollTop, true);
	}, false);

	initView();

	var pluginInterface = {
		initView,                     // Вызвать после замены модели.
		isResized,                    // Вызвать, если изменился размер по высоте (y).
		isItFullVisible,              // Возвращает true если строка полностью видна.
		getFirstSemiVisibleLineNum,   // Возвращает номер первой частично видимой строки.
		getFirstFullyVisibleLineNum,  // Возвращает номер первой полностью видимой строки.
		getMiddleVisibleLineNum,      // Возвращает номер средней строки.
		getMiddleFullyVisibleLineNum, // Возвращает номер средней полностью видимой строки.
		getLastFullyVisibleLineNum,   // Возвращает номер последней полностью видимой строки.
		getLastSemiVisibleLineNum,    // Возвращает номер последней частично видимой строки.
		setOnTop,                     // Задаёт номер строкт, которую нужно установить вверху.
		setOnMiddle,                  // Задаёт номер строкт, которую нужно установить по середине.
		setOnBottom,                  // Задаёт номер строкт, которую нужно установить внизу.
		onAfterRender : null,         // Скрипт события. Исполняется после перерендеринга строк в каретке.
	}

	return pluginInterface;



	function initView() {
		var
			countOfHalfVisibleLines = getCountOfHalfVisibleLines(),
			carriageHeight = countOfHalfVisibleLines * _.lineHeight,
			carriageBottomMargin = _.lineHeight * _.countOfAllLines - carriageHeight,
			firstLineNum = _.firstVisibleLineNum,
			lastLineNum = firstLineNum + countOfHalfVisibleLines - 1;

		_.carriage.innerHTML = "";
		
		for (var i = firstLineNum; i <= lastLineNum; i ++) {
			_.carriage.appendChild(_.getLine(i))
		}

		_.carriage.style.margimBottom = carriageBottomMargin+"px";
		window._e_ = code => eval(code);
	}

	function render(scrollTop, rerenderingFlag) {
		const 
			topHiddenSpace = scrollTop,
			countOfTopHiddenLines = Math.floor(topHiddenSpace / _.lineHeight);

		let
			countOfHalfVisibleLines = getCountOfHalfVisibleLines(),
			firstVisibleLineNum = countOfTopHiddenLines,
			lastVisibleLineNum = countOfTopHiddenLines + countOfHalfVisibleLines - 1;

		if (lastVisibleLineNum > _.lastLineNum) {
			lastVisibleLineNum = _.lastLineNum;
			countOfHalfVisibleLines = lastVisibleLineNum - firstVisibleLineNum + 1;
		}

		const
			carriageHeight = countOfHalfVisibleLines * _.lineHeight,
			carriageTopMargin = countOfTopHiddenLines * _.lineHeight,
			carriageBottomMargin = (_.countOfAllLines - countOfTopHiddenLines - countOfHalfVisibleLines) * _.lineHeight;

		const 
			visibleRange = new Region(firstVisibleLineNum, lastVisibleLineNum + 1),
			oldCarriageRange = new Region(
				parseInt(_.carriage.firstElementChild.dataset[_.dsLineNum]), 
				parseInt(_.carriage.lastElementChild.dataset[_.dsLineNum]) + 1
			),
			oldR = oldCarriageRange,
			newR = visibleRange;

		if (firstVisibleLineNum != _.firstVisibleLineNum || rerenderingFlag) {

			_.carriage.style.marginTop = carriageTopMargin+"px";
			
			if (oldR.first < newR.first) {

				while (
					_.carriage.firstElementChild
						&&
					!newR.includes(_.carriage.firstElementChild.dataset[_.dsLineNum])
				) {
					_.carriage.removeChild(_.carriage.firstElementChild);
				}

			} else if (newR.first < oldR.first) {

				newR.arr.forEach((v,i,a) => {
					
					if (!oldR.includes(v)) {

						var line = _.getLine(v);
						if (_.carriage.children[i]){
							_.carriage.insertBefore(line, _.carriage.children[i]);
						}
						else 
							_.carriage.appendChild(line);
					}
				});

			}

			if (oldR.next < newR.next) {
				newR.arr.forEach((v) => {
					if (!oldR.includes(v)) 
						_.carriage.appendChild(_.getLine(v))
				});

			} else if (newR.next < oldR.next) {

				while (
					_.carriage.lastElementChild
						&&
					!newR.includes(_.carriage.lastElementChild.dataset[_.dsLineNum])
				) {
					_.carriage.removeChild(_.carriage.lastElementChild);
				}

			}

			_.carriage.style.marginBottom = carriageBottomMargin+"px";
			
			_.firstVisibleLineNum = firstVisibleLineNum;

			if (pluginInterface.onAfterRender)
				pluginInterface.onAfterRender();
		}

	}

	function _Region() {
		return class Region {
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
	}

	function isItFullVisible(num) {
		const 
			viewStart = _.viewport.scrollTop,
			viewEnd   = viewStart + getViewHeight(),
			lineStart = num * lineHeight,
			lineEnd   = (num + 1) * lineHeight;
		return !!(viewStart <= lineStart && lineEnd <= viewEnd);
	}

	function isResized() {
		render(_.viewport.scrollTop, true);
	}

	function getFirstSemiVisibleLineNum() {
		const topHiddenSpace = _.viewport.scrollTop;
		return Math.floor(topHiddenSpace / _.lineHeight);
	}

	function getFirstFullyVisibleLineNum() {
		const 
			topHiddenSpace = _.viewport.scrollTop,
			num = Math.ceil(topHiddenSpace / _.lineHeight);
		if (isItFullVisible(num))
			return num;
		else 
			return -1;
	}

	function getMiddleVisibleLineNum() {
		const topHiddenSpace = _.viewport.scrollTop;
		return Math.floor((topHiddenSpace + getViewHeight() / 2) / _.lineHeight);
	}

	function getMiddleFullyVisibleLineNum() {
		const 
			topHiddenSpace = _.viewport.scrollTop,
			num = Math.floor((topHiddenSpace + getViewHeight() / 2) / _.lineHeight);
		if (isItFullVisible(num))
			return num;
		else 
			return -1;
	}

	function getLastFullyVisibleLineNum() {
		const 
			topHiddenSpace = _.viewport.scrollTop,
			num = Math.floor((topHiddenSpace + getViewHeight()) / _.lineHeight) - 1;
		if (isItFullVisible(num))
			return num;
		else 
			return -1;
	}

	function getLastSemiVisibleLineNum() {
		const topHiddenSpace = _.viewport.scrollTop;
		return Math.floor((topHiddenSpace + getViewHeight()) / _.lineHeight);
	}

	function setOnTop(strNum) {
		_.viewport.scrollTop = strNum * _.lineHeight;
	}


	function setOnBottom(strNum) {
		_.viewport.scrollTop = strNum * _.lineHeight - _.getViewHeight() + _.lineHeight;
	}

	function setOnMiddle(strNum) {
		_.viewport.scrollTop = strNum * _.lineHeight - (_.getViewHeight() - _.lineHeight) / 2;
	}


	function getViewHeight() {
		return _.viewport.getBoundingClientRect().height;
	}

	function getCountOfHalfVisibleLines() {
		return Math.floor(_.getViewHeight() / _.lineHeight + 2);
	}

	function create(html) {
		shell.innerHTML = html;
		return shell.children[0];
	}

}