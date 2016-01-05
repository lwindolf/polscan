# group: Packages
# name: No dpkg errors
# description: Checks no installed package has error flag

output=$(/usr/bin/dpkg -l 2>/dev/null | awk '/^iF/ {print $2}')
if [ $? -eq 0 ]; then
	result_ok
else
	result_failed "dpkg error flag set: $output"
fi
