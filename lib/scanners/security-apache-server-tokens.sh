# group: Security
# name: Apache ServerTokens
# description: An Apache production webserver should not give details in the "Server:" header
# tags: SV-36672r1_rule
# solution-cmd: a2enconf security

if [ -d /etc/apache2 ]; then
	if ! rgrep -q "ServerTokens[[:space:]][[:space:]]*Prod" /etc/apache2/*-enabled; then
		result_failed "ServerTokens is not set to 'Prod'"
	else
		result_ok
	fi
fi
