#!/bin/bash

# group: Security
# name: nginx Forbidden Ciphers
# description: An nginx production webserver should not allow those ciphers: aNULL, eNULL, EXPORT, DES, MD5, PSK, RC4
# source: https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html

for dir in /etc/nginx /usr/local/nginx/conf; do
	if [ -d $dir ]; then
		if rgrep -q "^[^#]*ssl_ciphers" $dir/*-enabled $dir/conf.d 2>/dev/null; then
			missing=
			for c in aNULL eNULL EXPORT DES MD5 PSK RC4; do 
				if ! rgrep -q "ssl_ciphers[[:space:]][[:space:]].*\!$c" $dir/*-enabled $dir/conf.d 2>/dev/null; then
					missing="${missing}!$c "
				fi
			done
			result_failed "$dir: ssl_ciphers does not have $missing"
		fi
	fi
done
