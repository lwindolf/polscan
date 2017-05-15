# group: Security
# name: No SSH User Equivalency
# description: There must be no direct user equivalency. To detect this we match all SSH keys of all users against all authorized_keys to find network wide user equivalency.
# solution: Remove reported keys from authorized_keys
# source: https://www.usenix.org/legacy/event/lisa04/tech/full_papers/napier/napier.pdf
# 

homes=$(/usr/bin/getent passwd |/bin/egrep -v "(false|nologin)$" | /usr/bin/cut -d : -f 6)
keys=
result=
authorized_keys_files=
for h in $homes; do
	if [ -d "$h/.ssh" ]; then
		keys="$keys $(find "$h/.ssh" -name "*.pub")"
		if [ -f "$h/.ssh/authorized_keys" ]; then
			authorized_keys_files="$authorized_keys_files $h/.ssh/authorized_keys"
		fi
	fi
done

for k in $keys; do
	kvalue=$(cut -d " " -f 2 "$k")
	if grep -q "$kvalue" $authorized_keys_files; then
		result="$result $k"
	fi
done

if [ "$result" == "" ]; then
	result_ok
else
	result_warning "Keys with possible user equivalency:" $result
fi
