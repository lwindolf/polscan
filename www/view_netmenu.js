// vim: set ts=4 sw=4: 
/* A view that allow to select the network view you want :-) */

views.NetmenuView = function NetmenuView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {};
};

views.NetmenuView.prototype.update = function(params) {
	$("head").append(`
		<style type='text/css'>
			.netmenu {
				padding:0 12px;
			}
			.netmenu .box {
				background: white;
				padding: 0px;
				margin-right: 24px;
				margin-bottom: 24px;
				float: left;
				width: 250px;
				height: 380px;
				border: 1px solid gray;
				cursor: pointer;
			}
			.netmenu img {
				border-bottom:1px solid gray;
			}
			.netmenu .box .title {
				padding:12px;
				font-size: 150%;
			}
			.netmenu .box .info {
				padding:12px;
				color:#444;
			}
			.netmenu .box:hover {
				background: #eee;	
				border: 1px solid #444;
			}
		</style>
	`);

	$(this.parentDiv).html(`
		<div class='netmenu'>
		<h2>Available Network Views</h2>
		<div class='box' onclick='setLocationHash({view: "network"})'>
			<img src='img/network.png'/>
			<div class='title'>Network Map</div>
			<div class='info'>Radial diagram of hosts grouped by subdomains and TCP connections. Most useful with hierarchical FQDNs.</div>
		</div>
		<div class='box' onclick='setLocationHash({view: "netedge"})'>
			<img src='img/netedge.png'/>
			<div class='title'>Network Edge</div>
			<div class='info'>A matrix of all active TCP connections to external IPv4 networks.</div>
		</div>
		<div class='box' onclick='setLocationHash({view: "netmap"})'>
			<img src='img/netmap.png'/>
			<div class='title'>Connection Browser</div>
			<div class='info'>Browse TCP connections per host and navigate along in-/outbound service connections.</div>
		</div>
		<div class='box' onclick='setLocationHash({view: "servicemap"})'>
			<img src='img/servicemap.png'/>
			<div class='title'>Service Map</div>
			<div class='info'>A directed graph of all active TCP services interconnections and in-/outbound external clients.</div>
		</div>

		</div>`);
};
