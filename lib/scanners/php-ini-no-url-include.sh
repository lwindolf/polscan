# group: PHP
# name: allow_url_include = Off
# description: Prevent PHP launching remote PHP scripts
# source: http://www.cyberciti.biz/tips/php-security-best-practices-tutorial.html

# We fuzzy check for at least one occurence of allow_url_include=Off
#
# Debian default is
#
# /etc/php5/apache2/php.ini:allow_url_include = Off
# /etc/php5/cli/php.ini:allow_url_include = Off

found_php=0
bad_dirs=
for d in /etc/php5 /usr/local/php*/conf; do
	if [ -d "$d" ]; then
		found_php=1
		if ! rgrep -q "^allow_url_include[[:space:]]*=[[:space:]]*Off" $d; then
			bad_dirs="$bad_dirs $d"
		fi
	fi
done

if [ "$found_php" == 1 ]; then
	if [ "$bad_dirs" ]; then
		result_failed "allow_url_include=Off not found in: $bad_dirs"
	else
		result_ok
	fi
fi
