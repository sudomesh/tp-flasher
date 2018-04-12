#!/usr/bin/env nodejs

var os = require('os');

var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['nocheck']
});

var TPFlasher = require('./index.js');

var tpIP = argv.ip || '192.168.0.66'; // these devices expect a tftp server at this IP
var tpPort = argv.port || 69;

function usage(p) {
    p("sudo flasher.js /path/to/firmware.image");
    p("  --nocheck:  Don't check if the router model is compatible with firmware file");
    p("  --ip: Alternate IP to use (default: 192.168.0.66)");
    p("  --port: Alternate port to use (default: 69)");
    p("  --help: Show this info");
}

if(argv._.length != 1) {
    usage(console.error);
    process.exit(1);
}

var firmwareFile = argv._[0];

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
//            console.log(addr);            
            if(addr.address == correctIP) {
                return true
            }
            // TODO check netmask
        }
    }
    return false;   
}

if(!checkForIP(tpIP)) {
    console.error("Error: Remember to give you ethernet interface the static IP", tpIP, "and ensure that your ethernet cable is plugged in and the router turned on.");
    return false;
}


var flasher = new TPFlasher();
flasher.flash(firmwareFile, {
    ip: tpIP,
    port: tpPort,
    nocheck: argv.nocheck
}, function(err) {
    if(err) {
        console.error("Error:", err);
        process.exit(1);
    }
    console.log("Firmware sent! Now just wait for the router to reboot :)");
})

