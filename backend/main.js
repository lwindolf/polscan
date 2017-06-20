var http = require("http"),
    https = require("https"),
    express = require("express"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    app = express(),
    promise = require("promise"),
    StatefulProcessCommandProxy = require("stateful-process-command-proxy");

var config = require('../etc/backend-config.json');
var probes = require('../etc/probes.json');

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
   rest.path = config["api"]["puppetdb/"+request.params.method]["path"];
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
function probe(request, response) {

   var probe = request.params.probe;
   var host = request.params.host;

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
          console.log(severity.toUpperCase() + " " +origin+" "+ msg);
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

   proxy.executeCommands(['hostname',cmd]).then(function(res) {
      response.writeHead(200, {'Content-Type': 'application/json'});
      // FIXME really process res, not just sending it
      response.end(JSON.stringify(res));
   }).catch(function(error) {
      console.log("proxy failed:"+error);
      response.writeHead(422, {'Content-Type': 'application/json'});
      response.end(JSON.stringify({"error":error}));
   });
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
   res.sendfile('index.html')  
});

http.createServer(app).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');
