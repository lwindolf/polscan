# group: Security
# name: Apache SSL Certs
# description: An Apache production webserver should not use weak certificates. Checks for weak signatures

for dir in /etc/apache2 /usr/local/apache2/conf /usr/local/apache/conf; do
	if [ -d $dir ]; then
		certs=$(grep "^[^#]*SSLCertificateFile" "$dir/"*-enabled/* 2>/dev/null)
		for c in $certs; do
			c=${c/#* /}
			x=$(openssl x509 -in "$c" -text)
			if echo "$x" | grep -q "Signature Algorithm: sha[12]WithRSAEncryption"; then
				result_failed "$c is SHA-1/2 signed which is insecure!"
			elif echo "$x" | grep -q "Signature Algorithm: sha256WithRSAEncryption"; then
				result_warning "$c is SHA-256 signed and might be insecure."
			fi
		done
	fi
done
