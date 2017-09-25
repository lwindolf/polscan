#!/usr/bin/env bats


# "Subdomain-Prefix" is a host name extractor, so we test some extractions
@test "domain example.com" {
	export HOST_LIST="example.com"
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "Subdomain-Prefix::com example.com" ]
}

@test "subdomain www.example.com" {
	export HOST_LIST="www.example.com"
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "Subdomain-Prefix::example www.example.com" ]
}

@test "multiple hosts" {
	export HOST_LIST="www1.example.com www2.example.com"
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "Subdomain-Prefix::example www1.example.com
Subdomain-Prefix::example www2.example.com" ]
}

@test "invalid hosts" {
	export HOST_LIST="www1 11"
	output=$($BASE/lib/host-group-providers/Subdomain-Prefix)
	[ "$output" == "" ]
}

