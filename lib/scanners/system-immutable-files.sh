# group: System
# name: Immutable Files
# description: There must be no immutable files as they would block automation tools.

files=$(lsattr -R / 2>/dev/null | grep -- "^[^/ ]*i" | cut -d " " -f 2)
if [ "$files" == "" ]; then
	result_ok
else
	result_failed "Immutable files found: $files"
fi
