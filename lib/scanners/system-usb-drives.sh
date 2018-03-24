#!/bin/bash

# group: System
# name: USB Drives
# description: On server systems USB disk devices are not normal. So you might want to know about all of them.

disks=$(ls /dev/disk/by-id/usb* 2>/dev/null)
if [ "$disks" == "" ]; then
	result_ok
else
	result_warning "USB disk devices found: $disks"
fi
