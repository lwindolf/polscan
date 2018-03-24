#!/bin/bash

# group: Security
# name: nginx ServerTokens
# description: An nginx production webserver should not give details in the 'Server:' header

for dir in /etc/nginx /usr/local/nginx/conf; do
	if [ -d $dir ]; then
		if ! rgrep -q "server_tokens[[:space:]][[:space:]]*off" $dir/*-enabled $dir/conf.d; then
			result_failed "server_tokens is not set to 'off'"
		fi
	fi
done
