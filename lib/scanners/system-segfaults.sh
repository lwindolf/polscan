#!/bin/bash

# group: System
# name: No Segfaults
# description: There shall be no 'segfault at ' messages in dmesg
# solution: Solution always depends on the application. Clear dmesg buffer to acknowledge.

logged=$(/bin/dmesg | grep ': segfault at ' | tail -10)
if [ "$logged" == "" ]; then
	result_ok
else
	result_warning "$logged"
fi
