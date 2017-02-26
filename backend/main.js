var http = require("http"),
    https = require("https"),
    express = require("express"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    app = express();

var config = require('../etc/backend-config.json');
var probes = require('../etc/probes.json');
app.use(express.static(path.join(__dirname, config["static"]["rootdir"])));
app.use(express.static("/results", path.join(__dirname, config["static"]["results"])));

// Query PuppetDB API
var puppetdb_rest = undefined;
try {
puppetdb_rest = { 
    hostname: config["api"]["puppetdb"]["hostname"],
    port:     config["api"]["puppetdb"]["port"],
    path:     config["api"]["puppetdb"]["path"],
    method: 'GET'
//    key: fs.readFileSync(config["api"]["puppetdb"]["ssl_key"]), 
//    cert: fs.readFileSync(config["api"]["puppetdb"]["ssl_cert"])
}; 
} catch(e) {
    console.log("No PuppetDB API configured.");
}

function puppetdb_api(request, response) {
   response.writeHead(200, {'Content-Type': 'application/json'});
   var req = https.request(puppetdb_rest, function(res) { 
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

app.get('/api/monitoring', function(req, res) {
   monitoring_api(req, res);
});

app.get('/api/puppetdb', function(req, res) {
   puppetdb_api(req, res);
});

app.all('*', function(req, res) {
   res.sendfile('index.html')  
});

http.createServer(app).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');
