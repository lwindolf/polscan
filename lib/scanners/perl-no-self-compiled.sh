#!/bin/bash

# group: Perl
# name: No self-compiled
# description: Checks there are no self-compiled Perl modules. Fuzzy check that takes existing directories as indication for those.

bad_dirs=
for s in $(
	perl -e 'print qq(@INC)' 2>/dev/null |\
	xargs -n 1 |\
	egrep -v '^/usr/share/|^/usr/lib|^/etc|^\.$'
); do
	if [ -d "$s" ]; then
		bad_dirs="${bad_dirs}$s "
	fi
done

if [ "$bad_dirs" != "" ]; then
	result_failed "Unexpected Perl module directories: $bad_dirs"
else
	result_ok
fi
