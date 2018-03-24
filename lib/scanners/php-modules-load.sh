#!/bin/bash

# group: PHP
# name: Modules Load
# description: Checks if all modules do load. Fuzzy check that uses the "php" from path. This might not always be the one you want.

php=$(which php)
if [ -f "$php" ]; then
	fails=$($php -m 2>&1 >/dev/null)
	if [ "$fails" != "" ]; then
		result_failed "$php module load failures: $fails"
	else
		result_ok
	fi
fi
