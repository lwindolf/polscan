
# Provide easy jq wrapper
JQ=$(which jq)
json() {
	printf "%s" "$1" | "$JQ" -r "$2"
}

# Provide k8s context iterating to be used for k8s standalone scanners
foreach_kube_context() {
	cmd="$1"
	shift
	for t in $(echo "$TARGET_LIST" | grep "^K8S " | cut -d" " -f2); do
		kubectl config use-context "$t" >&2 || exit 1
		$cmd
	done
	kubectl config unset current-context >&2 || exit 1
}

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

result_vulnerability() {
	cve=$1; shift
	pkg=$1; shift
	tags=$1; shift
	tags=${tags//, /,}
	tags=${tags//,/\",\"}

	cat <<EOT
Security VULN |||$pkg||| {"cve": "$cve", "pkg": "$pkg", "tags": ["${tags}"]}
EOT
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

puppet_enabled() {
	test "$puppet_report" != ""
	return $?
}

puppet_run_ok() {
	grep -q "^  status: failed" $puppet_report 2>/dev/null
	return $?
}

puppet_resource_exists() {
	resource_type=$1;	shift
	value=$1;		shift

	grep -q "resource: $resource_type\[$value\]" "$puppet_report" 2>/dev/null
	return $?
}
