// vim: set ts=4 sw=4: 
/* Helper function to run backend API calls */

function getAPI(name, callback, errorcb, params) {
	if(undefined !== params) {
		name += "?" + params.map(function(obj) {
			var k = Object.keys(obj)[0];
			return k + "=" + obj[k];
		}).join("&");
	}

	return $.getJSON("/api/" + name, {})
	.done(function(data) {
		callback(data);
	})
	.fail(function(j, t, e) {
		if(errorcb)
			errorcb(e);
		else
			error('Fetching API results for "'+name+'" failed!?<br/><br/>Exception: ' + e);
	}).promise();
}
