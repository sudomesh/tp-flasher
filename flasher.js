#!/usr/bin/env nodejs

var os = require('os');
var path = require('path');
var fs = require('fs');
var tftp = require('tftp');
var progress = require('progress-stream');
var isRoot = require('is-root');

var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['nocheck']
});

var tpIP = argv.ip || '192.168.0.66'; // these devices expect a tftp server at this IP
var tpPort = argv.port || 69;

function usage(p) {
    p("sudo flasher.js /path/to/firmware.image");
    p("  --nocheck:  Don't check if the router model is compatible with firmware file");
    p("  --ip: Alternate IP to use (default: 192.168.0.66)");
    p("  --port: Alternate port to use (default: 69)");
    p("  --help: Show this info");
}

if(tpPort < 1024 && !isRoot()) {
    console.error("You must be root to run this for ports under 1024");
    process.exit(1);
}

if(argv._.length != 1) {
    usage(console.error);
    process.exit(1);
}

var firmwareFile = argv._[0];
var firmwareFileSize;

try {
    stats = fs.statSync(firmwareFile);
    if(!stats.isFile()) {
        console.error("Not a file:", firmwareFile);
        process.exit(1);
    }
} catch(e) {
    console.error("No such file:", firmwareFile);
    process.exit(1);
}
firmwareFileSize = stats.size;


function checkForIP(correctIP) {

    if(!os.networkInterfaces) {
        return false
    }
    var ifaces = os.networkInterfaces();
    var i, iface, addrs, addr;
    for(iface in ifaces) {
        addrs = ifaces[iface];
        for(i=0; i < addrs.length; i++) {
            addr = addrs[i];
            if(addr.internal || addr.family != 'IPv4') continue;
            
            if(addr.address == correctIP) {
                return true
            }
            // TODO check netmask
        }
    }
    return false;   
}

if(!checkForIP(tpIP)) {
    console.error("Error: Remember to give you ethernet interface the static IP " + tpIP);
    return false;
}

var server = tftp.createServer({
    host: tpIP,
    port: tpPort,
    denyPUT: true
}, function(req, res){

    console.log("Received tftp request from", req.stats.remoteAddress, "for file", req.file);
    
    if(!argv.nocheck) {
        var m = req.file.match(/^wdr\d{4}/);
        if(!m) {
            console.error("Error: The name of the requested file indicates that the router you are trying to flash is not one of the compatible routers.")
            console.error("Use --nocheck to ignore");
            req.abort(tftp.EIO);
            server.close();
            process.exit(1);
        }
        var routerModel = m[0];
        if(!firmwareFile.match(routerModel)) {
            m = routerModel.match(/wdr\d{4}/);
            var firmwareModel = m[0];
            console.error("Error: The name of the requested file vs. the name of the supplied firmware file indicates that you are trying to use the wrong firmware for this router.")
            console.error("It looks like you are trying to use a firmware meant for a TP-Link",firmwareModel,"to flash a TP-Link",routerModel,"router.");
            console.error("Use --nocheck to ignore");
            req.abort(tftp.EIO);
            server.close();
            process.exit(1);
        }        
    } else {
        console.log("Router model looks correct for firmware filename");
    }

    res.setSize(firmwareFileSize);
    var firmwareStream = fs.createReadStream(firmwareFile);

    console.log("Sending firmware to router...");
    var prog = progress({
	      length: firmwareFileSize
    });

    var done = false;
    prog.on('progress', function(progress) {
        console.log("Sent: " + Math.round(progress.percentage*100)/100 + "%");
        if(progress.percentage >= 100) {
            if(done) {
                return;
            }
            console.log("Firmware sent! Now just wait for the router to reboot :)");
            console.log("This program won't exit. It will just wait for the next node that needs flashing.");
            console.log("Hit ctrl-c to exit.");
            firmwareStream.close();
            done = true;
        }
    });

    firmwareStream.pipe(prog).pipe(res);
    
    req.on("error", function(err) {});
});




server.on('error', function(er) {
  //Errors from the main socket 
  //The current transfers are not aborted 
  console.error(err);
});

console.log("Starting tftp server on "+tpIP+" port "+tpPort);
console.log("Ensure you are connected to one of the LAN ports on the router");
console.log("Then hold down the reset button on the router, turn it on, wait 10 seconds, then release the reset button and wait.");
server.listen();
