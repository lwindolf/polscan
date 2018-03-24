#!/bin/bash

# group: Security
# name: securetty
# description: No root login via virtual consoles and serial ports
# tags: CCE-26855-7 CCE-27047-0

insecure=$(egrep '^(ttyS[0-9]|vc/[0-9])[[:space:]]*$' /etc/securetty)
if [ "$insecure" != "" ]; then
	result_failed "/etc/securetty allows root login via" $insecure
else
	result_ok
fi

