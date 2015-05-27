# FIXME: Check $LIB_DIR, $CONF_DIR, $BASE_DIR

CONF_FILE=${CONF_DIR}/polscan.conf
REMOTE_SCANNERS_FILE=${CONF_DIR}/scanners.conf
STANDALONE_SCANNERS_FILE=${CONF_DIR}/standalone.conf

if [ ! -f $CONF_FILE ]; then
	echo "ERROR: Could not find $CONF_FILE"
	exit 1
fi
source $CONF_FILE

# Select result dir
if [ "$RESULT_BASE_DIR" == "" ]; then
	RESULT_BASE_DIR=${BASE}/results
fi

LATEST=0
if [ "$1" == "" ]; then
	DATE=$(date +%Y/%m/%d)
	LATEST=1
fi

RESULT_DIR="${RESULT_BASE_DIR}/${DATE}"
JSON_DIR="${RESULT_BASE_DIR}/json/${DATE}"

################################################################################
# get_policy_group
#
# $1	file name
#
# Returns group id of policy checked by that file
################################################################################
get_policy_group() {
	sed "
		/# group:/!d;
		s/.*: *//;
	" "$1"
}

################################################################################
# get_policy_name
#
# $1	file name
#
# Returns descriptive name of policy checked by that file
################################################################################
get_policy_name() {
	sed "
		/# name:/!d;
		s/.*: *//;
	" "$1"
}

################################################################################
# get_policy_description
#
# $1	file name
#
# Returns human readable description of policy checked by that file
################################################################################
get_policy_description() {
	sed "
		/# description:/!d;
		s/.*: *//;
		s/\"/'/g;
	" "$1"
}
