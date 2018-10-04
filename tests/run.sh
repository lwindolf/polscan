export BASE="../"
export RESULT_DIR=$(mktemp -d)
err=0
for t in  */*.sh; do
	printf "\n%s\n" "$t"
	if ! bats "$t"; then
		err=1
	fi
done 
rm -rf ${RESULT_DIR}
exit $err
