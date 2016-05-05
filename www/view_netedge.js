// vim: set ts=4 sw=4: 
/* A view visualizing persistent connections of all servers
   from/to the internet as well as changes in those over
   a certain time range */

views.NetedgeView = function NetedgeView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		host: true,
		filterby: true,
		search: true
	};
};

views.NetedgeView.prototype.addHosts = function(cid, filteredHosts) {
    var view = this;
	view.hostNames = new Array();

	getData("Network", function(data) {
		var dc = $('#'+cid).get(0).getContext("2d");
		var offsetX = 0;

		$.each(data.results, function(i, item) {
			if(-1 !== filteredHosts.indexOf(item.host) && item.policy == "Connections") {
				var cin = new Array();
				var cout = new Array();
				var count = 0;
				for(var i = 1; i < 255; i++) {
					cin[i]=0;
					cout[i]=0;
				}
				var connections = item.message.split(/ /);
				for(var c in connections) {
					var fields = connections[c].split(/:/);
					if(fields[5]) {
						// For now we do not visualize local connections
						if(fields[1] == fields[3])
							continue;

						var tmp = fields[3].split(/\./);
						tmp[0] = parseInt(tmp[0]);
						tmp[1] = parseInt(tmp[1]);
						if(tmp[0] !== 10 && tmp[0] !== 127 && tmp[0] !== 172 && tmp[0] !== 192) { // FIXME!!!!
							if(fields[5] === 'in')
								cin[tmp[0]] += fields[6];
							else
								cout[tmp[0]] += fields[6];
							count++;
						}
					}
				}
				if(count > 0) {
					offsetX += 6;
					view.hostNames[view.hostNames.length] = item.host;
					for(var i = 1; i < 255; i++) {
						if(cin[i] != 0) {
							dc.fillStyle = "blue";
							dc.fillRect(offsetX, i*6, 4, 4);
						} else if(cout[i] != 0) {
							dc.fillStyle = "#777";
							dc.fillRect(offsetX, i*6, 4, 4);
						} else {
							dc.fillStyle = "#ddd";
							dc.fillRect(offsetX, i*6, 4, 4);
						}
					}
				}
			}
		});
	});
}

views.NetedgeView.prototype.update = function(params) {
	var filteredHosts = get_hosts_filtered(params);

	clean();
	$('#results').append('<div>Network: <span id="selectedNetwork">(hover for values)</span></div><div> Host: <span id="selectedHost"/></div><canvas id="netedge" width="'+filteredHosts.length*6+'" height="8000"/>');
	this.addHosts('netedge', filteredHosts);
};
