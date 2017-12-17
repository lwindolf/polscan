// vim: set ts=4 sw=4: 
/* Probe API singleton, allowing one host being probed at a time.
   Manages auto-updates and probe dependency tree  */

function ProbeAPI() {
	if(arguments.callee._singletonInstance) {
		return arguments.callee._singletonInstance;
	}

	arguments.callee._singletonInstance = this;

	var a = this;
	$.ajax({
		dataType: "json",
		async: false,
		url: "/api/probes",
		success: function(data) {
			a.probes = data;
		}
	    // FIXME: error handling
	});

	// Perform a given probe and call callback cb for result processing
	this.probe = function(name, cb, errorCb) {
		var a = this;

		a.probes[name].updating = true;
		a.probes[name].timestamp = Date.now();

		// on updates we need to use the previously stored callback
		if(undefined === cb) {
			cb      = a.probes[name].cb;
			errorCb = a.probes[name].errorCb;
		} else {
			a.probes[name].cb      = cb;
			a.probes[name].errorCb = errorCb;
		}

		getAPI('probe/'+name+'/'+a.host, function(res) {
		    // FIXME: check actual response code here!

			a.probes[name].updating = false;
			a.probes[name].timestamp = Date.now();

			// Always trigger follow probes, serialization is done in backend
			for(var p in res.next) {
				a.probe(res.next[p], cb);
			}

			if(undefined !== cb)
				cb(name, a.host, res);
		}, function(e) {
			// FIXME: use a promise instead
			a.probes[name].updating = false;
			a.probes[name].timestamp = Date.now();
			errorCb(e);
		});	
	};

	// Triggers the initial probes, all others will be handled in the
	// update method
	this.startProbes = function(cb, errorCb) {
		var a = this;
		Object.keys(a.probes).forEach(function(p) {
            if(a.probes[p].initial)
				a.probe(p, cb, errorCb);
        });
	};

	// Start probing a given host, handles initial probe list fetch
	// Ensures to stop previous host probes.
	this.start = function(host, cb, errorCb) {
		this.host = host;
		this.stop();
		this.startProbes(cb, errorCb);
		this.update();
	};

	// Stop all probing
	this.stop = function() {
		clearTimeout(this.updateTimer);
		this.probeStates = {};
	};

	this.update = function() {
		var a = this;
		var now = Date.now();
		this.updateTimer = setTimeout(this.update.bind(this), 5000);		
		$.each(this.probes, function(name, p) {
			if(p.updating === false && p.refresh*1000 < now - p.timestamp)
				a.probe(name)
		});
	};
}
