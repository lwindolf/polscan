# group: Security
# name: Apache XFO sameorigin
# description: An Apache production webserver might want to prevent embedding its pages as frames. This prevents clickjacking.
# source: https://www.owasp.org/index.php/List_of_useful_HTTP_headers

for dir in /etc/apache2 /usr/local/apache2/conf /usr/local/apache/conf; do
	if [ -d $dir ]; then
		if ! rgrep -qRP "Header\s+set\s+X-Frame-Options:\s+.sameorigin." $dir/*-enabled; then
			result_failed "XFO Header is not set to 'sameorigin' in $dir"
		else
			result_ok "$dir has XFO header set to 'sameorigin'"
		fi
	fi
done
