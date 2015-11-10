# group: Security
# name: No root aliases
# description: Ensures there are no users with UID 0 besides root.
# tags: CCE-26971-2

tmp=$(awk -F: '($3 == "0") {print}' /etc/passwd | grep -v "^root:")
if [ "$tmp" != "" ]; then
	result_failed "There should be no users with UID 0 besides root (but there are: $tmp)"
fi
