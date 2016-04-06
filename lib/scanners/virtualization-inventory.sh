# group: Virtualization
# name: Inventory
# description: Inventory only scanner virtualization instance count (containers, VMs) and type (KVM, LXC, docker...)

vtype=
while [ 1 ]; do
	# Check KVM/libvirt
	if virsh -version >/dev/null 2>&1; then
		# Do not use virsh list --name to support older versions
		instances=$(virsh list | egrep -c -v "^$|^---|State")
		vtype=KVM
		break
	fi

	# Check docker
	if docker version >/dev/null 2>&1; then
		instances=$(docker info 2>/dev/null | grep Images | sed 's/.*\://')
		vtype=Docker
		break
	fi

	# Check LXC
	out=$(lxc-ls >/dev/null 2>&1)
	if [ "$out" != "" ]; then
		instances=$(echo "$out" | wc -l)
		vtype=LXC
		break
	fi

	break
done

if [ "$vtype" != "" ]; then
	result_inventory "Type" "$vtype"
	result_inventory "Count" "$instances"
fi
