var http = require("http");
var https = require("https");
var fs = require("fs");

// You will often want to enable the following line
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var config = require('../etc/backend-config.json');

var icinga2_rest = { 
    hostname: config["api"]["monitoring"]["hostname"],
    port:     config["api"]["monitoring"]["port"],
    path:     config["api"]["monitoring"]["path"],
    method: 'GET',
    key: fs.readFileSync(config["api"]["monitoring"]["ssl_key"]), 
    cert: fs.readFileSync(config["api"]["monitoring"]["ssl_cert"])
}; 

http.createServer(function (request, response) {
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
}).listen(8081);

// Console will print the message
console.log('Server running at http://127.0.0.1:8081/');
