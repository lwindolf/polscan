# group: Network
# name: Black Hole Routes
# description: Ensure that we do not forget about black hole routes. Those can be leftovers of DoS mitigation attempts and are easily forgotten producing issues for DSL customers.

ips=$(/sbin/route -n | grep "UGH.* lo$" | awk '{print $1}' | head -25)
if [ "$ips" == "" ]; then
	result_ok
else
	result_warning "Black hole routes found: $ips"
fi
