#!/bin/bash

# group: Security
# name: No promiscuous interface
# description: Ensures there are no interfaces in promiscuous mode indicating package capturing
# solution-cmd: /sbin/ip a | grep PROMISC | awk -F: '{print $2}' | xargs -n 1 -I "{}" ifconfig "{}" -promisc

interfaces=$(/sbin/ip a | grep PROMISC | awk -F: '{print $2}')
if [ "$interfaces" != "" ]; then
	result_warning "Interfaces in promiscuous mode: $interfaces"
else
	result_ok
fi
