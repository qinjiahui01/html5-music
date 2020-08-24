(function ($, root) {
	var dur;
	var frameId;
	var startTime = 0;
	var lastPer = 0;

	function renderAllTime(time) {	//渲染总时间
		dur = time;
		time = formatTime(time);
		$('.all-time').html(time);
	}
	function formatTime(time) {
		time = Math.round(time);
		//253	4:13
		var m = Math.floor(time / 60);
		var s = time % 60;

		m = m < 10 ? '0' + m : m;
		s = s < 10 ? '0' + s : s;

		return m + ':' + s;
	}

	//开始进度条的功能
	function start(p) {
		lastPer = p === undefined ? lastPer : p;

		cancelAnimationFrame(frameId);

		startTime = new Date().getTime();

		function frame() {
			var curTime = new Date().getTime();
			var per = lastPer + (curTime - startTime) / (dur * 1000);

			if (per <= 1) {
				upDate(per);
			} else {
				cancelAnimationFrame(frameId);
			}

			frameId = requestAnimationFrame(frame);
		}
		frame();
	}

	//更新进度条
	function upDate(per) {
		//更新时间
		var time = formatTime(per * dur);
		$('.cur-time').html(time);

		var perX = (per - 1) * 100 + '%';

		//更新进度条的位置
		$('.pro-top').css('transform', 'translateX(' + perX + ')');
	}

	//停止进度条
	function stop() {
		cancelAnimationFrame(frameId);
		var stopTime = new Date().getTime();

		//var per = lastPer + (curTime - startTime) / (dur * 1000);
		lastPer = lastPer + (stopTime - startTime) / (dur * 1000);
	}

	root.proControl = {
		renderAllTime: renderAllTime,
		start: start,
		upDate: upDate,
		stop: stop
	}
})(window.Zepto, window.player || (window.player = {}))