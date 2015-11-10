# group: Security
# name: PAM nullok
# description: PAM should not allow nullok or nullok_secure
# tags: CCE-27038-9

if grep -q nullok /etc/pam.d/common-auth; then
	result_failed "Found nullok in /etc/pam.d/common-auth"
else
	result_ok
fi

