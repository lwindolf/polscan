// vim: set ts=4 sw=4: 
/* A view visualizing persistent connections of all servers
   from/to the internet as well as changes in those over
   a certain time range */

views.NetedgeView = function NetedgeView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		filterby: true,
		search: true
	};
	this.previousSelection = {
		x: 0,
		y: 0
	};
	this.dataGroup = "Network";
	this.policy = "Connections";
};

views.NetedgeView.prototype.addTooltip = function() {
	var view = this;

	var changeTooltipPosition = function(event) {
		var tooltipX = event.pageX + 8;
		var tooltipY = event.pageY + 8;

		if(tooltipX > $(window).width() * 2 / 3 - 16)
			tooltipX = $(window).width() * 2 / 3 - 16;

		$('div.tooltip').css({
			top: tooltipY,
			left: tooltipX,
//			z-index: 1,
			width: $(window).width() / 3
		});
	};

	var showTooltip = function(event) {
		var details = "";
		var host = view.hostNames[event.pageX / 6];
		var cache = resultCache[view.dataGroup];

		if(!host) {
			console.log("Fatal: cannot determine host");
//			return;
		}

		if(!cache)
			console.log("Fatal: no cache for "+view.dataGroup);
		else
			$.each(cache.results, function(i, item) {
				if(item.host == host) {
					if(item.severity == "OK") {
						okFound = true;
					} else {
						details += "<tr>";
					if(item.group)
						details += "<td class='group'>" + item.group + "</td>";
						details += "<td class='policy "+item.severity+"'>" + item.policy + "</td><td class='message'>" + ((item.message.length>100)?item.message.substring(0,100)+" [...]":item.message) + "</td></tr>";
					}
				}
			});

		$('div.tooltip').remove();
		$('<div class="tooltip"><b>'+host+'</b><table class="resultTable">'+details+'</table></div>').appendTo('#netedge');
		changeTooltipPosition(event);
	};

	var hideTooltip = function() {
		$('div.tooltip').remove();
	};

	$("#netedge").bind({
		mousemove : changeTooltipPosition,
		mouseenter : showTooltip,
		mouseleave: hideTooltip
	});
}

views.NetedgeView.prototype.addHosts = function(cid, filteredHosts) {
    var view = this;
	view.hosts = {};
	view.hostNames = new Array();

	getData("netedge TCP connection", function(data) {
		var dc = $('#'+cid).get(0).getContext("2d");
		var offsetX = 0;

		$.each(data.results, function(i, item) {
			if(-1 !== filteredHosts.indexOf(item.host)) {
				var cin = new Array();
				var cout = new Array();
				var count = 0;

				// For now we do not visualize local connections
				if(item.ln == item.rn)
					return;

				var tmp = item.rn.split(/\./);
				tmp[0] = parseInt(tmp[0]);
				tmp[1] = parseInt(tmp[1]);
				if(filteredHosts.length < 100 || (tmp[0] !== 10 && tmp[0] !== 127 && tmp[0] !== 172 && tmp[0] !== 192)) { // FIXME!!!!
			        if(!view.hosts[item.host]) {
			        console.log("adding "+item.host+ " "+view.hosts.length);
			            view.hosts[item.host] = {
    					    cin:  new Array(224),
    					    cout: new Array(224),
    					    name: item.host
        				};
	       				for(var i = 1; i < 224; i++) {
	            			view.hosts[item.host].cin[i]=0;
        					view.hosts[item.host].cout[i]=0;
			            }
			            view.hostNames[view.hostNames.length] = item.host;
                    }

					if(item.dir === 'in')
						view.hosts[item.host].cin[tmp[0]] += item.cnt;
					else
    					view.hosts[item.host].cout[tmp[0]] += item.cnt;
				}
			}
		});

		$.each(view.hosts, function(h, host) {			
			offsetX += 6;
			for(var i = 1; i < 224; i++) {
				if(host.cin[i] != 0) {
					dc.fillStyle = "yellow";
					dc.fillRect(offsetX, i*6, 4, 4);
				} else if(host.cout[i] != 0) {
					dc.fillStyle = "white";
					dc.fillRect(offsetX, i*6, 4, 4);
				} else {
					dc.fillStyle = "#222";
					dc.fillRect(offsetX, i*6, 4, 4);
				}
			}
        });
		view.addTooltip();
	});
}

views.NetedgeView.prototype.update = function(params) {
	var filteredHosts = get_hosts_filtered(params);
	var view = this;

	clean();
	$('#results').append('<div>Network: <span id="selectedNetwork">(hover for values)</span></div><div> Host: <span id="edgeHost"></span></div><canvas id="netedge" style="background:black;" width="'+filteredHosts.length*6+'" height="1344"/>');
	this.addHosts('netedge', filteredHosts);

	$('#netedge').on('click', function(event) {
		var hostSlot = Math.floor(event.offsetX / 6) - 1;
		var netSlot = Math.floor(event.offsetY / 6) - 1;
		if(view.hostNames) {
			if(hostSlot < view.hostNames.length) {
				setLocationHash({ h: view.hostNames[hostSlot], view: 'netmap' });
			}
		}
	});

	$('#netedge').on('mousemove', function(event) {
		var hostSlot = Math.floor(event.offsetX / 6) - 1;
		var netSlot = Math.floor(event.offsetY / 6) - 1;

		if((hostSlot != view.previousSelection.x) ||
		   (netSlot != view.previousSelection.y)) {
			var dc = $('#netedge').get(0).getContext("2d");
			dc.globalAlpha = 1.0;

			// Clear previous selection
			dc.strokeStyle = 'black';
			dc.clearRect((view.previousSelection.x + 1) * 6 -2, 6, 2, 224*6);
			dc.clearRect((view.previousSelection.x + 1) * 6 +4, 6, 2, 224*6);
			dc.clearRect(1, (view.previousSelection.y + 1) * 6 - 2, (view.hostNames.length + 1)*6, 2);
			dc.clearRect(1, (view.previousSelection.y + 1) * 6 + 4, (view.hostNames.length + 1)*6, 2);

			view.previousSelection = {
				x: hostSlot,
				y: netSlot
			};

			if(view.hostNames) {
				if(hostSlot < view.hostNames.length) {
					// Draw new cross hairs
					dc.strokeStyle = '#aaa';
					dc.lineWidth = 1;

					dc.beginPath();
					dc.moveTo((view.previousSelection.x + 1) * 6 - 1, 6);
					dc.lineTo((view.previousSelection.x + 1) * 6 - 1, 224*6);
					dc.stroke();

					dc.beginPath();
					dc.moveTo((view.previousSelection.x + 1) * 6 + 5, 6);
					dc.lineTo((view.previousSelection.x + 1) * 6 + 5, 224*6);
					dc.stroke();

					dc.beginPath();
					dc.moveTo(5, (view.previousSelection.y + 1) * 6 - 1);
					dc.lineTo((view.hostNames.length + 1) * 6, (view.previousSelection.y + 1) * 6 - 1);
					dc.stroke();
		
					dc.beginPath();
					dc.moveTo(5, (view.previousSelection.y + 1) * 6 + 5);
					dc.lineTo((view.hostNames.length + 1) * 6, (view.previousSelection.y + 1) * 6 + 5);
					dc.stroke();

					$('#edgeHost').html(view.hostNames[hostSlot]);
				}
			}
		}

		$('#selectedNetwork').html((netSlot+1) + ".0.0.0/8");
	});
};
