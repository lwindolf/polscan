#!/bin/bash

# group: SSH
# name: X11Forwarding no
# description: Checks /etc/ssh/sshd_config for X11Forwarding yes
# solution-cmd: sed -i 's/X11Forwarding.*yes/X11Forwarding no/' /etc/ssh/sshd_config

if grep -q "X11Forwarding yes" /etc/ssh/sshd_config 2>/dev/null; then
	result_failed
else
	result_ok
fi
