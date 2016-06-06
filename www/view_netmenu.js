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
				padding: 0 12px;
			}
			.netmenu .box {
				background: white;
				padding: 24px;
				margin-right: 24px;
				margin-bottom: 24px;
				float: left;
				max-width: 25%;
				min-height: 120px;
				border: 1px solid gray;
				cursor: pointer;
			}
			.netmenu .box .title {
				font-size: 150%;
				margin-bottom: 12px;
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
			<div class='title'>Network Map</div>
			<div class='info'>A radial map of hosts grouped by subdomains and their network connections.</div>
		</div>
		<div class='box' onclick='setLocationHash({view: "netedge"})'>
			<div class='title'>Network Edge</div>
			<div class='info'>A matrix of all IPv4 connections to external networks.</div>
		</div>
		<div class='box' onclick='setLocationHash({view: "netmap"})'>
			<div class='title'>Connection Browser</div>
			<div class='info'>Browse TCP connections per host and navigate along in-/outbound service connections.</div>
		</div>
		<div class='box' onclick='setLocationHash({view: "servicemap"})'>
			<div class='title'>Service Map</div>
			<div class='info'>A directed graph of all services and their relations.</div>
		</div>

		</div>`);
};
