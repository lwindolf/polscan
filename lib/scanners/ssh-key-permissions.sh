# group: SSH
# name: Key Permissions
# description: Checks for correct key permissions. This avoids having unusable/unprotected keys.
	
error=0
users=$(getent passwd | awk -F: '{if(($3 >= 1000) && ($3 < 65534)) { print $1 }}')
for u in $users; do
	homedir=$(getent passwd $u | cut -d: -f 6)
	if [ -d "${homedir}/.ssh" ]; then
		if find "${homedir}" -name .ssh -perm "/g+w,o+w" -printf >/dev/null 2>&1; then
			result_failed "${homedir}/.ssh too open"
			error=1
		fi
		insecure_keys=$(
			find "${homedir}/.ssh" -regex ".*id_[a-z]*" -perm "/g+rwx,o+rwx"
			find "${homedir}/.ssh" -regex ".*id_[a-z]*.pub" -perm "/g+w,o+w"
		)
		if [ "$insecure_keys" != "" ]; then
			result_failed "Insecure key file permissions:" $insecure_keys
			error=1
		fi
	fi
done

if [ $error -eq 0 ]; then
	result_ok
fi
