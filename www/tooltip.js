function installTooltip(container, cb) {
	var tooltipShowCb = cb;
	var changeTooltipPosition = function(event) {
		var tooltipX = event.pageX + 8;
		var tooltipY = event.pageY + 8;

		if(tooltipX > $(window).width() * 2 / 3 - 16)
			tooltipX = $(window).width() * 2 / 3 - 16;

		$('div.tooltip').css({
			top: tooltipY,
			left: tooltipX,
			width: $(window).width() / 3
		});
	};

	var hideTooltip = function() {
		$('div.tooltip').remove();
	};
	var showTooltip = function(event) {
		var content = cb(this, event);
		$('div.tooltip').remove();
		$('<div class="tooltip">'+content+'</div>').appendTo('#results');
		changeTooltipPosition(event);
	};

	$(container).bind({
		mousemove : changeTooltipPosition,
		mouseenter : showTooltip,
		mouseleave: hideTooltip
	});
}


