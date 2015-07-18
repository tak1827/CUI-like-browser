var http = require('http');
var url = require('url');
var os = require('os');
var fs = require('fs');
var child_process = require('child_process');

var PORT = 8081;
var user = "user"; // Default is 'user'
var usrIp; // user@ip-255-255-255-255
var logFile = 'access.log';
var logDir = __dirname;


// Create http server
var server = http.createServer(function(request, response) {

    server.emit('accessed', request);// Create accesslog

    var cmd = getCmd(request);
    console.log('command: ' + cmd);

    var output = ''; // Output for Browser

    // Do initializ on first connection
    if (cmd === 'initialize-connection') {
        server.emit('send', response, output);
    }
    // Exit when 'exit' was inputed
    else if (cmd === 'exit') {
        output += " " + cmd + "\n";
        output += (process.exit() === 0) ? "\n\nBay" : "\n\nError";
        server.emit('send', response, output);
    }
    // Execute 'cd' command
    else if (cmd.substr(0, 2) === 'cd') {
        output += " " + cmd + "\n";
        process.chdir(cmd.substr(3));
        server.emit('send', response, output);
    }
    // Execute 'vi' command
    else if (cmd.substr(0, 2) === 'vi') {
        output += " " + cmd + "\n";
        var path = cmd.substr(3);
        fs.readFile(path, 'utf8', function(err, data) {
            output = data;
            server.emit('send', response, output);
        });
        // var fileReadStream = fs.createReadStream(path, {encoding: "utf8"});
        // fileReadStream.pipe(response);
    }
    // Execute shell command
    else {
        child_process.exec(cmd, {
                encoding: 'utf8'
            },
            function(err, stdout, stderr) {
                output += " " + cmd + "\n";
                console.log("stdout: "+stdout);
                output += (err !== null && err !== '') ? 
                	err : (stdout !== null && stdout !== '') ? 
                	stdout : stderr;
                server.emit('send', response, output);
            }
        );
    }
}).listen(PORT, function() {
    console.log("Server running at http://" + os.hostname() + ":" + PORT + "/");
});


// Send output
server.on('send', function(response, output) {
    response = createHeader(response); // Set http header
    output += "\n" + createUsrIpDir();
    response.end(output);
});


// Recode access log
server.on('accessed', function(request) {
	createAccesslog(request);
});


/**
 * Create accesslog
 * @param request
 */
function createAccesslog(request) {
    var log;
    log = "[" + new Date() + "] "; // accessed datetime
    log += JSON.stringify(request.headers); // request header
    var path = logDir + '/' + logFile; //  path of access.log
    // If extists,  get contents of access.log
    var oldLog = (fs.existsSync(path)) ? fs.readFileSync(path, 'utf8') + '\n\n' : '';
    fs.writeFileSync(path, oldLog + log, 'utf8'); // write access.log
}


/**
 * Get command form http request
 * @param request
 * @return cmd
 */
function getCmd(request) {
    var cmd;
    cmd = url.parse(request.url).pathname; // Remove querystring
    cmd = decodeURIComponent(cmd);
    cmd = cmd.substr(1); // Remove '/' of the head
    if (cmd === 'favicon.ico') return; // Ignore favicon
    return cmd;
}


/**
 * Create [user@ip-255-255-255-255 dirctory]$ 
 * @return [user@ip dir]$
 */
function createUsrIpDir() {
    if (!usrIp) {
        var ifconf = os.networkInterfaces();
        var interf = ifconf.eth0 || ifconf.en0; // en0 is for MacOSX
        var ip;
        // Get ip address
        for (var i = 0; i < interf.length; i++) {
            if (interf[i].family === 'IPv4') {
                ip = interf[i].address;
                break;
            }
        }
        ip = ip.replace(/\./g, "-");
        usrIp = user + "@ip-" + ip;
    }
    var dir = process.cwd(); // Get path
    dir = dir.substr(dir.lastIndexOf('/') + 1); // Get directory name
    return "[" + usrIp + " " + dir + "]$";
}


/**
 * Create http header
 * @param response
 * @return response
 */
function createHeader(response) {
    response.writeHead(200, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*' // Cross domain step
    });
    return response;
}