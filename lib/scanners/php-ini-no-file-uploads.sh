#!/bin/bash

# group: PHP
# name: file_uploads = Off
# description: Prevent file uploads.
# source: http://www.cyberciti.biz/tips/php-security-best-practices-tutorial.html

# We fuzzy check for at least one occurence of file_uploads = Off
#
# Debian default is (none)

found_php=0
bad_dirs=
for d in /etc/php5 /usr/local/php*/conf; do
	if [ -d "$d" ]; then
		found_php=1
		if ! rgrep -q "^file_uploads[[:space:]]*=[[:space:]]*Off" $d; then
			bad_dirs="$bad_dirs $d"
		fi
	fi
done

if [ "$found_php" == 1 ]; then
	if [ "$bad_dirs" ]; then
		result_failed "file_uploads=Off not found in: $bad_dirs"
	else
		result_ok
	fi
fi
