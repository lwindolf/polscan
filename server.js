// vim: set ts=4 sw=4: 
/*
  Copyright (C) 2015-2018  Lars Windolf <lars.windolf@gmx.de>
 
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
 
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
 
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var http = require("http"),
    https = require("https"),
    express = require("express"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    app = express(),
    promise = require("promise"),
    net = require("net"),
    StatefulProcessCommandProxy = require("stateful-process-command-proxy");

var config = require('./etc/config.json');
var probes = require('./etc/probes.json');

process.on('uncaughtException', function(err) {
  // dirty catch of broken SSH pipes
  console.log(err.stack);
});

// Query PuppetDB API
var puppetdb_rest = undefined;
try {
puppetdb_rest = { 
    hostname: config["api"]["puppetdb"]["hostname"],
    port:     config["api"]["puppetdb"]["port"],
    method: 'GET'
//    key: fs.readFileSync(config["api"]["puppetdb"]["ssl_key"]), 
//    cert: fs.readFileSync(config["api"]["puppetdb"]["ssl_cert"])
}; 
} catch(e) {
    console.log("No PuppetDB API configured.");
}

function puppetdb_api(request, response) {
   response.writeHead(200, {'Content-Type': 'application/json'});
   var rest = puppetdb_rest;
   var api = config["api"]["puppetdb/"+request.params.method];
   rest.path = api["path"];
   if(undefined !== api["params"]) {
       for(p in api["params"]) {
           var param = api["params"][p];
           rest.path = rest.path.replace("{{"+param+"}}", request.query[param]);
       }
   } 

   var req = https.request(rest, function(res) { 
       res.on('data', function(data) { 
           response.write(data); 
       }); 
       res.on('end', function(data) { 
	   response.end(); 
       }); 
   }); 

   req.end();

   req.on('error', function(e) { 
     console.error(e); 
     response.end("Internal error");
   });
}

var icinga2_rest = undefined;
try {
icinga2_rest = { 
    hostname: config["api"]["monitoring"]["hostname"],
    port:     config["api"]["monitoring"]["port"],
    path:     config["api"]["monitoring"]["path"],
    method: 'GET',
    key: fs.readFileSync(config["api"]["monitoring"]["ssl_key"]), 
    cert: fs.readFileSync(config["api"]["monitoring"]["ssl_cert"])
}; 
} catch(e) {
    console.log("No Icinga2 monitoring API configured.");
}

// Remote server probe API

function get_probes(request, response) {
   response.writeHead(200, {'Content-Type': 'application/json'});

   // Return all probes and initial flag so a frontend knows
   // where to start
   var output = {};
   Object.keys(probes).forEach(function(probe) {
       var p = probes[probe];
       output[probe] = {
           name     : p.name,
           initial  : p.initial,
           refresh  : p.refresh
       };
   });
   response.end(JSON.stringify(output));
}

function probe(request, response) {

   var probe = request.params.probe;
   var host = request.params.host;

   try {
	   if(!(probe in probes)) {
		  response.writeHead(404, {'Content-Type': 'application/json'});
		  response.end(JSON.stringify({error:'No such probe'}));
		  return;
	   }
	   
	   var cmd = probes[probe].command;
	   var proxy = new StatefulProcessCommandProxy(
		{
		  name: "proxy_"+host,
		  max: 1,
		  min: 1,
		  idleTimeoutMS: 15000,

		  logFunction: function(severity,origin,msg) {
		      //console.log(severity.toUpperCase() + " " +origin+" "+ msg);
		  },

		  processCommand: '/usr/bin/ssh',
		  processArgs:  [host],
		  processRetainMaxCmdHistory : 0,

		  processInvalidateOnRegex :
		      {
		        'stderr':[{regex:'.*error.*',flags:'ig'}]
		      },

		  processCwd : './',
		  processUid : null,
		  processGid : null,
		  initCommands : ['LANG=C;echo'],	// to catch banners and pseudo-terminal warnings

		  validateFunction: function(processProxy) {
		      return processProxy.isValid();
		  },
	   });

	   proxy.executeCommands([cmd]).then(function(res) {
		   response.writeHead(200, {'Content-Type': 'application/json'});

		   var msg = {
		       name   : probe,
		       stdout : res[0].stdout,
		       stderr : res[0].stderr,
		       next   : []
		   };
		   if('name'    in probes[probe]) msg['name']    = probes[probe].name;
		   if('render'  in probes[probe]) msg['render']  = probes[probe].render;
		   if('type'    in probes[probe]) msg['type']    = probes[probe].type;

		   // Suggest followup probes
		   for(p in probes) {
		      if(probes[p]['if'] === probe && -1 !== res[0].stdout.indexOf(probes[p]['matches']))
				msg['next'].push(p);
		   }

		  response.end(JSON.stringify(msg));
	   }).catch(function(error) {
		  response.writeHead(422, {'Content-Type': 'application/json'});
		  response.end(JSON.stringify({"error":e}));
		  done(e);
		  return;
	   });
   } catch(e) {
      response.writeHead(422, {'Content-Type': 'application/json'});
      response.end(JSON.stringify({"error":e}));
      done(e);
      return;
   }
}

// Query Icinga2 API
function monitoring_api(request, response) {
   response.writeHead(200, {'Content-Type': 'application/json'});
   var req = https.request(icinga2_rest, function(res) { 
       res.on('data', function(data) { 
           response.write(data); 
       }); 
       res.on('end', function(data) { 
	   response.end(); 
       }); 
   }); 

   req.end();

   req.on('error', function(e) { 
     console.error(e); 
     response.end("Internal error");
   });
}

function static_content(type, path, response) {
   try {
      response.writeHead(200, {'Content-Type': 'application/json'});
      fs.readFileSync(config["static"][type]+path), 
      response.write(data); 
      response.end(); 
   } catch(e) {
      response.writeHead(404);
      response.end("File not found");
   }
}

// Routing

app.get('/api/probes', function(req, res) {
   get_probes(req, res);
});

app.get('/api/probe/:probe/:host', function(req, res) {
   probe(req, res);
});

app.get('/api/icinga2', function(req, res) {
   monitoring_api(req, res);
});

app.get('/api/puppetdb/:method', function(req, res) {
   puppetdb_api(req, res);
});

app.use(express.static(path.join(__dirname, config["static"]["rootdir"])));
app.use("/results", express.static(path.join(__dirname, config["static"]["results"])));

app.all('*', function(req, res) {
   res.sendfile('index.html', { root: config["static"]["rootdir"] })
});

http.createServer(app).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');
