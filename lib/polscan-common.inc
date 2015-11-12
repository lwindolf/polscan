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

# Syntax: polscan [-l <host list>] [<date>]

if [ "$1" == "-l" ]; then
	shift
	HOST_LIST=$1
	shift
else
	HOST_LIST=
fi

LATEST=0
if [ "$1" == "" ]; then
	DATE=$(date +%Y/%m/%d)
	LATEST=1
fi
ONE_DAY_AGO=$(date -d "$DATE 1 day ago" +%Y/%m/%d)

RESULT_DIR="${RESULT_BASE_DIR}/${DATE}"
JSON_DIR="${RESULT_BASE_DIR}/json/${DATE}"

################################################################################
# Determine host groups
#
# Host group providers give <host group>+<host> tuples. Which we regroup here
# to per host group host lists.
#
# Fills the global hash "host_groups"
################################################################################

declare -A host_groups

load_host_groups() {
	export HOST_LIST	# Some providers might want to use it

	while read host_group host rest; do
		host_groups[''$host_group]="${host_groups[''$host_group]}${host} "
	done < <($LIB_DIR/host-group-providers/$HOST_GROUP_PROVIDERS | grep -v '^$')
}


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
# FIXME: Somehow allow multi line descriptions
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

################################################################################
# get_scanners
#
# $1	type "standalone" or "remote"
#
# Returns scanner filename
################################################################################
get_scanners() {
	scanner_type=$1

	case $scanner_type in
		remote)
			conf_file="$REMOTE_SCANNERS_FILE"
			;;
		standalone)
			conf_file="$STANDALONE_SCANNERS_FILE"
			;;
		*)
			echo "ERROR: get_scanners() called with invalid scanner type!"
			exit 1
	esac

	grep -v "^ *#" "$conf_file" 2>/dev/null
}
