#!/bin/bash

# group: Security
# name: Apache SSL Protocol
# description: An Apache production webserver should disable legacy protocols

failed=0
for dir in /etc/apache2 /usr/local/apache2/conf /usr/local/apache/conf; do
	if [ -d $dir ]; then
		# There should be no SSLProtocol lines without the following patterns
		for m in "-SSLv2" "-SSLv3"
		do
			if [ "$(rgrep SSLProtocol $dir/ | grep -v -- "$m")" != "" ]; then
				result_failed "SSLProtocol should include $m ($dir)"
				failed=1
			fi
		done

		if ! rgrep -q "[^#]*SSLHonorCipherOrder.*on" $dir; then
			result_failed "SSLHonorCipherOrder should be on ($dir)"
		fi

		# POODLE disabled
		if ! rgrep -q "[^#]*SSLCompression.*off" $dir; then
			result_failed "SSLCompression should be off ($dir)"
		fi
	fi
done

if [ "$failed" = 0 ]; then
	result_ok
fi
