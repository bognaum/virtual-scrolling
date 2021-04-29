export default function virtualScrolling(viewport, getLine, allLinesCount, lineHeight) {
	var version = "1.0.0";

	
	var shell = document.createElement("div");

	var _ = {
		viewport,
		carriage : create(`<div class="carriage"></div>`),
		getViewHeight,
		allLinesCount,
		lineHeight,
		dsLineNum : "virtualScrollingLineNum",
		getLine : function(num) {
			const lineEl = getLine(num);
			lineEl.dataset[_.dsLineNum] = num;
			lineEl.lNum = num;
			return lineEl;
		},
		firstVisibleLineNum : 0,
		showLNums: [0],
	};

	_.viewport.dataset.virtual_scrollingVer = version;


	_.viewport.appendChild(_.carriage);
	_.viewport.addEventListener("scroll", function(e) {
		render(this.scrollTop);
	}, false);
	window.addEventListener("resize", function(e) {
		render(_.viewport.scrollTop, true);
	}, false);

	_.viewport.getHeight = function() {
		// return this.getBoundingClientRect().height;
		return parseInt(getComputedStyle(this).height);
	}

	initView();

	const pluginInterface = {
		viewport: _.viewport,         // Вьюпорт.
		initView,                     // Вызвать после замены модели.
		isResized,                    // Вызвать, если изменился размер по высоте (y).
		isItFullVisible,              // Возвращает true если строка полностью видна.
		getFirstSemiVisibleLineNum,   // Возвращает номер первой частично видимой строки.
		getFirstFullyVisibleLineNum,  // Возвращает номер первой полностью видимой строки.
		getMiddleVisibleLineNum,      // Возвращает номер средней строки.
		getMiddleFullyVisibleLineNum, // Возвращает номер средней полностью видимой строки.
		getLastFullyVisibleLineNum,   // Возвращает номер последней полностью видимой строки.
		getLastSemiVisibleLineNum,    // Возвращает номер последней частично видимой строки.
		getMaxScrollTop,              // Возвращает максимально возможный scrollTop.
		setOnTop,                     // Задаёт номер строки, которую нужно установить вверху.
		setOnMiddle,                  // Задаёт номер строки, которую нужно установить по середине.
		setOnBottom,                  // Задаёт номер строки, которую нужно установить внизу.
		onAfterRender : null,         // Скрипт события. Исполняется после перерендеринга строк в каретке.
	}

	return pluginInterface;



	function initView() {
		const 
			{viewOvLoc, lineLayout, showLNums} = calculate(_),
			lH = lineHeight;

		for (let v of showLNums) {
			_.carriage.appendChild(_.getLine(v));
		}

		_.showLNums = showLNums;

		_.carriage.style.marginTop    = `${lineLayout.top    * lH}px`;
		_.carriage.style.marginBottom = `${lineLayout.bottom * lH}px`;
	}

	function render(scrollTop, rerenderingFlag) {

		const 
			{viewOvLoc, lineLayout, showLNums} = calculate(_, scrollTop),
			lH = lineHeight;

		const 
			oldArr = _.showLNums,
			newArr = showLNums;

		if (newArr[0] != oldArr[0] || rerenderingFlag) {

			_.carriage.style.marginTop    = `${lineLayout.top    * lH}px`;
			_.carriage.style.marginBottom = `${lineLayout.bottom * lH}px`;


			if (oldArr[0] < newArr[0]) {

				while (
					_.carriage.firstElementChild
						&&
					! newArr.includes(
						parseInt(_.carriage.
							firstElementChild.dataset[_.dsLineNum]))

				) {
					_.carriage.removeChild(_.carriage.firstElementChild);
				}

			} else if (oldArr[0] > newArr[0]) {

				newArr.forEach((v,i,a) => {
					
					if (!oldArr.includes(v)) {

						var line = _.getLine(v);
						if (_.carriage.children[i]){
							_.carriage.insertBefore(line, _.carriage.children[i]);
						}
						else 
							_.carriage.appendChild(line);
					}
				});

			}

			if (oldArr.last() < newArr.last()) {
				newArr.forEach((v) => {
					if (!oldArr.includes(v)) 
						_.carriage.appendChild(_.getLine(v))
				});

			} else if (oldArr.last() > newArr.last()) {

				while (
					_.carriage.lastElementChild
						&&
					! newArr.includes(
						parseInt(_.carriage.
							lastElementChild.dataset[_.dsLineNum]))
				) {
					_.carriage.removeChild(_.carriage.lastElementChild);
				}

			}

			_.showLNums = showLNums;

			if (pluginInterface.onAfterRender)
				pluginInterface.onAfterRender();
		}

	}

	function calculate(_, scrollTop=0) {
		const 
			viewOvLoc = {
				from: scrollTop,
				to  : scrollTop + _.viewport.getHeight()
			},
			lineLayout = {
				top: null,
				show: null,
				bottom: null,
			};

			lineLayout.top = (() => {
				let n = Math.floor(viewOvLoc.from / _.lineHeight) - 1;
				n = (n < 0)? 0 : n;

				return n;
			})();
			lineLayout.show = (() => {
				let n = Math.ceil(viewOvLoc.to / _.lineHeight) + 1;
				n = (_.allLinesCount < n)? _.allLinesCount : n;

				return  n - lineLayout.top;
			})();
			lineLayout.bottom = _.allLinesCount 
				- lineLayout.top - lineLayout.show;

			const showLNums = new Array(lineLayout.show);

			for (let [i,v] of showLNums.entries()) 
				showLNums[i] = lineLayout.top + i;

			showLNums.last = _.showLNums.last = function() {
				return this[this.length - 1];
			}

		return {viewOvLoc, lineLayout, showLNums};
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

	function getMaxScrollTop() {
		return _.viewport.scrollHeight - _.viewport.getHeight();
		/*return _.allLinesCount * _.lineHeight 
			- _.viewport.getHeight();*/
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

	function getHalfVisibleLinesCount() {
		return Math.floor(_.getViewHeight() / _.lineHeight + 2);
	}

	function create(html) {
		shell.innerHTML = html;
		return shell.children[0];
	}

}