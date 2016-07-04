# Override "echo" to prefix current host and policy infos
echo() {
	/bin/echo $current_host $policy_group "$@"
}

# Reporting findings
result_ok() {
	echo "OK |||$policy_name||| $@"
}

result_failed() {
	echo "FAILED |||$policy_name||| $@"
}

result_warning() {
	echo "WARNING |||$policy_name||| $@"
}

# Inventory handling
result_inventory() {
	name=$1; shift

	echo "INVENTORY |||$name||| $@"
}

result_network_edge() {
	etype=$1;	shift
        scope=$1;	shift
	ln=$1;		shift	# local IP/name
	ltn=$1;		shift   # local transport name
	rn=$1;		shift	# remote IP/name
	rtn=$1;		shift	# remote transport name
	dir=$1;		shift	# 'in'/'out'
	cnt=$1;		shift	# connection count

	# FIXME: validate parameters
	cat <<EOT
Network NETEDGE |||$etype||| {"host": "$(hostname -f)", "scope": "$scope", "ln": "$ln", "ltn": "$ltn", "rn": "$rn", "rtn": "$rtn", "dir": "$dir", "cnt": "$cnt"}
EOT
}
