
var fs = require('fs');
var tftp = require('tftp');
var isRoot = require('is-root');
var progress = require('progress-stream');

function flash(firmwareFile, opts, cb) {

    opts.ip = opts.ip || '192.168.0.66'; // these devices expect a tftp server at this IP

    opts.port = opts.port || 69; // the default tftp port

    if(opts.port < 1024 && !isRoot()) {
        console.error("You must be root to run this for ports under 1024");
        process.exit(1);
    }

    var firmwareFileSize;
    
    try {
        stats = fs.statSync(firmwareFile);
        if(!stats.isFile()) {
            console.error("Not a file:", firmwareFile);
            return cb("not a file");
        }
    } catch(e) {
        console.error("No such file:", firmwareFile);
        return cb("file not found");
    }
    firmwareFileSize = stats.size;
    
    var server = tftp.createServer({
        host: opts.ip,
        port: opts.port,
        denyPUT: true
    }, function(req, res){

        console.log("Looks like a router connected from IP", req.stats.remoteAddress, "and asked for a firmware file called", req.file);
    
        if(!argv.nocheck) {
            var m = req.file.match(/^wdr\d{4}/);
            if(!m) {
                console.error("Error: The name of the requested file indicates that the router you are trying to flash is not one of the compatible routers.")
                console.error("Use --nocheck to ignore");
                req.abort(tftp.EIO);
                server.close();
                return cb("incompatible router model");
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
                return cb("compatible router but wrong firmware file for this specific model");
            }
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

                // Add delay before closing connections, just in case
                setTimeout(function() {
                    firmwareStream.close();
                    server.close();
                    cb();
                }, 2000);
                
                done = true;
            }
        });
        
        firmwareStream.pipe(prog).pipe(res);
        
        req.on("error", function(err) {
            console.error("Request error:", err)
        });
    });
    
    
    server.on('error', function(er) {
        // Errors from the main socket 
        // The current transfers are not aborted 
        console.error("Server errorL", err);
    });
    
    console.log("Starting tftp server on "+opts.ip+" port "+opts.port);
    console.log("Ensure you are connected with an ethernet cable to one of the LAN ports on the router");

    console.log("Power off the router. Then hold down the reset button on the back of the router, turn it on, wait 10 seconds, then release the reset button and wait for the flashing to begin.");
    server.listen();
    
}

module.exports = function() {
    this.flash = flash;
};
