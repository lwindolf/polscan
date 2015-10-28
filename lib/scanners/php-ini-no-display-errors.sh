# group: PHP
# name: display_errors = Off
# description: Prevent exposing PHP error.
# source: http://www.cyberciti.biz/tips/php-security-best-practices-tutorial.html

# We fuzzy check for at least one occurence of display_errors=Off
#
# Debian default is
#
# /etc/php5/apache2/php.ini:display_errors = Off
# /etc/php5/cli/php.ini:display_errors = Off

found_php=0
bad_dirs=
for d in /etc/php5 /usr/local/php*/conf; do
	if [ -d "$d" ]; then
		found_php=1
		if ! rgrep -q "^display_errors[[:space:]]*=[[:space:]]*Off" $d; then
			bad_dirs="$bad_dirs $d"
		fi
	fi
done

if [ "$found_php" == 1 ]; then
	if [ "$bad_dirs" ]; then
		result_failed "display_errors=Off not found in: $bad_dirs"
	else
		result_ok
	fi
fi
