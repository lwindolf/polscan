# group: Systemd
# name: No masked services
# description: Ensure there are no masked services

output=$(systemctl list-units 2>/dev/null)
if [ "$output" != "" ]; then
	masked=$(/bin/echo "$output" | grep " masked " | cut -d " " -f2)
	if [ "$masked" != "" ]; then
		result_warning "There are masked services: " $masked
	else
		result_ok
	fi
fi
