# group: PHP
# name: expose_php = Off
# description: Prevent expose the PHP version in 'X-Powered-By' HTTP header
# source: http://www.cyberciti.biz/tips/php-security-best-practices-tutorial.html

# We fuzzy check for at least one occurence of expose_php=Off
#
# Debian default is
#
# /etc/php5/apache2/php.ini:expose_php = On
# /etc/php5/cli/php.ini:expose_php = On

found_php=0
bad_dirs=
for d in /etc/php5 /usr/local/php*/conf; do
	if [ -d "$d" ]; then
		found_php=1
		if ! rgrep -q "^expose_php[[:space:]]*=[[:space:]]*Off" $d; then
			bad_dirs="$bad_dirs $d"
		fi
	fi
done

if [ "$found_php" == 1 ]; then
	if [ "$bad_dirs" ]; then
		result_failed "expose_php=Off not found in: $bad_dirs"
	else
		result_ok
	fi
fi
