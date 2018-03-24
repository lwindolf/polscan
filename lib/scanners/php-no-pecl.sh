#!/bin/bash

# group: PHP
# name: No PECL
# description: Checks there are no PECL installed modules at all. This makes sense when using disto packages or self-build packages exclusively.

packages=$(pecl list 2>/dev/null |grep -A1000 ^PACKAGE | grep -v "PACKAGE")
if [ "$packages" != "" ]; then
	result_failed "Unexpected PECL packages: $packages"
else
	result_ok
fi
