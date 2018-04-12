WARNING: this repo is not maintained and is highly unstable. it is very likely that you will brick your router if you attempt to us it

tp-flasher is used to flash OpenWRT (or derivatives) onto routers that expect a TFTP server. It was written for use with certain TP-Link routers (see below) but if you use the --nocheck and --ip options it could be used for any router that needs a tftp server.


# Explicitly supported routers

* TP-Link WDR3500
* TP-Link WDR3600
* TP-Link WDR4300

For other routers use --nocheck and use --ip to set the IP address that the router is expecting the tftp server on.

# Usage

```
sudo flasher.js /path/to/firmware.image
  --nocheck:  Don't check if the router model is compatible with firmware file
  --ip: Alternate IP to use (default: 192.168.0.66)
  --port: Alternate port to use (default: 69)
  --help: Show this info
```

# Instructions

First hook up an ethernet cable from your computer's ethernet port to one of the LAN ports on the router (the WAN port won't work). 

## Setting a static IP

Give your ethernet interface the static IP 192.168.0.66

If you aren't using network-manager for your ethernet interface then you can use something like:

```
sudo ifconfig eth0 192.168.0.66 netmask 255.255.255.0 up
```

If you're using network-manager you can right-click the little network/wifi icon in your task bar and click `Edit connections` then select the wired connection under Ethernet, click edit, select the `IPv4 Settings`, set Method to Manual, then click Add and set the address to 192.168.0.66 and the netmask to 255.255.255.0 (and leave Gateway blank or 0.0.0.0) and then finally click save. You'll now need to left-click the network/wifi taskbar icon and click the `Disconnect` item listed under your `Wired connection 1`, then click the icon again and now click `Wired connection 1`.

## Prerequisites

Ensure you have the right firmware image for your router.

Ensure you have a recent version of [node.js](https://nodejs.org/)

Install git, e.g:

```
sudo apt update
sudo apt install git
```

Download this program and install pre-requisites:

```
git clone https://github.com/sudomesh/tp-flasher
cd tp-flasher/
npm install
```

## Running this program

Run:

```
sudo ./flasher.js path/to/my_firmware_image.bin
```


## Getting the router into flashy mode

Hold down the reset button on the router. While holding down the reset button turn the router on. Keep holding the reset button for 10 seconds. Release the reset button.

Now wait for the flasher program to output progress percentages as it uploads the firmware :)

## Troubleshooting

If this program refuses to run after you set a static IP with an error about not having the right IP then it's likely because you're using network-manager (default in ubuntu) and network-manager is taking your ethernet interface offline when it detects that you're not connected to anything (because the router is turned off). Simply turn the router on, wait 10 seconds, then start this program, then turn the router off and follow the instructions normally.
