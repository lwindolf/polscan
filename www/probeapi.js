// vim: set ts=4 sw=4: 
/* Probe API singleton, allowing one host being probed at a time.
   Manages auto-updates and probe dependency tree  */

function ProbeAPI() {
	if(arguments.callee._singletonInstance) {
		return arguments.callee._singletonInstance;
	}

	arguments.callee._singletonInstance = this;

	// Perform a given probe and call callback cb for result processing
	this.probe = function(name, cb, errorCb) {
		var a = this;
		getAPI('probe/'+name+'/'+a.host, function(res) {
		    // FIXME: check actual response code here!

			// Always trigger follow probes, serialization is done in backend
			for(var p in res.next) {
				a.probe(res.next[p], cb);
			}

			if(undefined !== cb)
				cb(name, a.host, res);
		}, errorCb);	
	};

	// Triggers the initial probes, all others will be handled in the
	// update method
	this.startProbes = function(cb, errorCb) {
		var a = this;
		Object.keys(a.probes).forEach(function(p) {
            if(a.probes[p].initial)
				a.probe(p, cb, errorCb);
        });

		// FIXME: Setup update timer
	};

	// Start probing a given host, handles initial probe list fetch
	// Ensures to stop previous host probes.
	this.start = function(host, cb, errorCb) {
		var a = this;
		a.host = host;
		a.stop();

		if(undefined === a.probes) {
			// On first call we need to fetch the probe list first
			getAPI("probes", function(data) {
				a.probes = data;
				a.startProbes(cb, errorCb);
			});
		} else {
			a.startProbes(cb, errorCb);
		}
	};

	// Stop all probing
	this.stop = function() {
		// FIXME: clearInterval(a.timer);
	};
}
