// vim: set ts=4 sw=4: 

/* Helper function to present a list of finding groups to choose from 
 *
 * @param id: element to attach list to
 * @param target: view name for click target
 */

function group_list(id, target) {
		$(id).append('<div id="group_list"/>');
		getData("overview", function(data) {
			$.each(data.overview.sort(function(a,b) {
				if(!a.group || !b.group)
					return 0;
				if(a.FAILED !== b.FAILED)
					return b.FAILED - a.FAILED;
				return b.WARNING - a.WARNING;
			}), function(i, d) {
				if(!d.group)
					return;
				$('#group_list').append(render('group_list_item', d));
			});
		});
}
