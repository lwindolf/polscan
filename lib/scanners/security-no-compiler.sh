# group: Security
# name: No compiler
# description: Production systems, especially frontends should have no compiler to prevent overly easy privilege escalation.

if [ -f /usr/bin/cc ]; then
	result_failed "Compiler found: /usr/bin/cc"
else
	result_ok
fi
