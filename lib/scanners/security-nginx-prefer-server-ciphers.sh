#!/bin/bash

# group: Security
# name: nginx Prefer Server Ciphers
# description: An nginx production webserver should prefer the server side ciphers.
# source: https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html

for dir in /etc/nginx /usr/local/nginx/conf; do
	if [ -d $dir ]; then
		if ! rgrep -q "ssl_prefer_server_ciphers[[:space:]][[:space:]]*on" $dir/*-enabled $dir/conf.d; then
			result_failed "ssl_prefer_server_ciphers is not set to 'on'"
		fi
	fi
done
