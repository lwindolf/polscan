#!/bin/bash

# group: PHP
# name: open_basedir is set
# description: PHP code should be restricted to its code directory.
# source: http://www.cyberciti.biz/tips/php-security-best-practices-tutorial.html

# We fuzzy check for at least one occurence of openbase_dir
#
# Debian default is (none)

found_php=0
bad_dirs=
for d in /etc/php5 /usr/local/php*/conf; do
	if [ -d "$d" ]; then
		found_php=1
		if ! rgrep -q "^open_basedir" $d; then
			bad_dirs="$bad_dirs $d"
		fi
	fi
done

if [ "$found_php" == 1 ]; then
	if [ "$bad_dirs" ]; then
		result_failed "open_basedir not found in: $bad_dirs"
	else
		result_ok
	fi
fi
