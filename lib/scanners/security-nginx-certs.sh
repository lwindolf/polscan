# group: Security
# name: nginx SSL Certs
# description: An nginx production webserver should not use weak certificates. Checks for weak signatures (better than SHA-256) and RSA public key size (>=4096)
# solution: You need to create a new certificate with stronger signing signature and/or RSA public key size
# tags: NIST-800-57
# source: http://csrc.nist.gov/publications/nistpubs/800-57/sp800-57_part1_rev3_general.pdf
# source: https://www.cabforum.org/wp-content/uploads/Baseline_Requirements_V1.pdf
# source: https://blog.mozilla.org/security/2014/09/23/phasing-out-certificates-with-sha-1-based-signature-algorithms/
# source: http://social.technet.microsoft.com/wiki/conatents/articles/32288.windows-enforcement-of-sha1-certificates.aspx
# source: http://security.stackexchange.com/questions/109629/deprecation-of-sha1-code-signing-certificates-on-windows
# source: https://support.microsoft.com/en-us/kb/2661254



for dir in /etc/nginx /usr/local/nginx/conf; do
	if [ -d $dir ]; then
		while read -r c; do
			c=${c//[\'\"]}
			x=$(openssl x509 -in "$c" -text)

			# Check for weak signature algorithm
			if echo "$x" | grep -q "Signature Algorithm: sha1WithRSAEncryption"; then
				result_failed "$c is SHA-1 signed which is insecure!"
			elif echo "$x" | grep -q "Signature Algorithm: sha256WithRSAEncryption"; then
				result_warning "$c is SHA-256 signed and might be insecure."
			fi

			# Check for insufficient RSA key sizes
			key_size=$(
				echo "$x" | grep "RSA Public Key: ([0-9][0-9]* bit)" |\
				sed 's/.*(\([0-9][0-9]*\) bit).*/\1/'
			)
			if [ "$key_size" != "" ]; then
				if [ "$key_size" -lt 1024 ]; then
					result_failed "$c has public key size '$key_size' which is insecure!"
				elif [ "$key_size" -lt 4096 ]; then
					result_warning "$c has public key size '$key_size' which is insufficient (should be >=4096)"
				fi
			fi
				
			# Check for expired/expiring certs (1 week)
			if ! openssl x509 -checkend 604800 -noout -in "$c"; then
				result_failed "$c expired/expire soon ($(openssl x509 -enddate -noout -in "$c"))."
			fi
		done < <(
			grep -h "^[^#]*ssl_certificate[^_]" "$dir/"*-enabled/* 2>/dev/null |\
			sed 's/^.*ssl_certificate *//;s/;//'
		)
	fi
done
