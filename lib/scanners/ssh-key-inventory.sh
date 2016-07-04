# group: SSH
# name: Inventory
# description: Inventory only scanner fuzzy guessing SSH key equivalencies from authorized_keys comment field. Recognizes all non-revoked keys with <user>@<host> in the comment field. Fuzzy matches host names to known FQDNs.

fqdn=$(hostname -f)
users=$(getent passwd | awk -F: '{if(($3 >= 1000) && ($3 < 65534)) { print $1 }}')
for u in $users; do
	homedir=$(getent passwd "$u" | cut -d: -f 6)
	afile="${homedir}/.ssh/authorized_keys"
	if [ -f "${afile}" ]; then
		while read user host; do
			# Track once for inbound host
			result_network_edge "Key Equivalency" "$u" "$fqdn" high "$user@$host" high in 1

			# Track once for originating host
			result_network_edge "Key Equivalency" "$host" "$user@$host" high "$fqdn" high out 1
		done < <(
			grep -v "^@revoked" "$afile" | sed "s/.* //" | grep ".@..." | sed "s/@/ /"
		)
	fi
done
