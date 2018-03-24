#!/bin/bash

# group: Security
# name: Apache Forbidden Ciphers
# description: An Apache production webserver should not allow those ciphers: aNULL, eNULL, EXPORT, DES, MD5, PSK, RC4
# source: https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html
# source: http://security.stackexchange.com/questions/51680/optimal-web-server-ssl-cipher-suite-configuration

for dir in /etc/apache2 /usr/local/apache2/conf /usr/local/apache/conf; do
	if [ -d $dir ]; then
		if rgrep -q "^[^#]*SSLCipherSuite" $dir/*-enabled $dir/conf.d 2>/dev/null; then
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
