# group: Security
# name: Apache ServerTokens
# description: An Apache production webserver should not give details in the "Server:" header
# tags: SV-36672r1_rule
# solution-cmd: a2enconf security

for dir in /etc/apache2 /usr/local/apache2/conf /usr/local/apache/conf; do
	if [ -d $dir ]; then
		if ! rgrep -q "ServerTokens[[:space:]][[:space:]]*Prod" $dir/*-enabled; then
			result_failed "ServerTokens is not set to 'Prod'"
		fi
	fi
done
