#!/bin/bash

# group: Python
# name: No Pip
# description: Checks there are no Pip installed packages at all. This makes sense when using distro packages or self-build packages exclusively.

packages=$(pip freeze 2>/dev/null)
if [ "$packages" != "" ]; then
	result_failed "Unexpected Python packages: $packages"
else
	result_ok
fi
