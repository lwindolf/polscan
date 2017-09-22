#!/usr/bin/env bats


# "Domain" is a host name extractor, so we test some extractions
@test "domain example.com" {
	export HOST_LIST="example.com"
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "Domain::com example.com" ]
}

@test "subdomain www.example.com" {
	export HOST_LIST="www.example.com"
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "Domain::example.com www.example.com" ]
}

@test "multiple hosts" {
	export HOST_LIST="www1.example.com www2.example.com"
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "Domain::example.com www1.example.com
Domain::example.com www2.example.com" ]
}

@test "invalid hosts" {
	export HOST_LIST="www1 11"
	output=$($BASE/lib/host-group-providers/Domain)
	[ "$output" == "" ]
}

