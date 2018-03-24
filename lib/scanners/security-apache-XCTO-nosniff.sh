#!/bin/bash

# group: Security
# name: Apache XCTO nosniff
# description: An Apache production webserver might want to prevent MSIE from file type sniffing. Only set if you are sure all your documents have proper MIME types, otherwise you might break your site for MSIE users.
# source: https://blogs.msdn.microsoft.com/ie/2008/09/02/ie8-security-part-vi-beta-2-update/
# source: https://www.owasp.org/index.php/List_of_useful_HTTP_headers

for dir in /etc/apache2 /usr/local/apache2/conf /usr/local/apache/conf; do
	if [ -d $dir ]; then
		if ! rgrep -qRP "Header\s+set\s+X-Content-Type-Options:\s+.nosniff." $dir/*-enabled; then
			result_failed "XCTO Header is not set to 'nosniff' in $dir"
		else
			result_ok "$dir has XCTO header set to 'nosniff'"
		fi
	fi
done
