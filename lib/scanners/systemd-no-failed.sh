# group: Systemd
# name: No failed services
# description: Ensure there are no failed services or units in maintenance

output=$(systemctl list-units 2>/dev/null)
if [ "$output" != "" ]; then
	failed=$(echo "$output" | grep " loaded (maintenance|failed) " | cut -d " " -f2)
	if [ "$failed" != "" ]; then
		result_warning "There are failed services: "
	else
		result_ok
	fi
fi
