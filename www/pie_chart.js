function addPieChart(id, title, size, pColor, data) {
	return new d3pie(id, {
		"header": {
			"title": {
				"text": title,
				"color": "#fff",
			},
		},
		"size": {
			"canvasWidth": size*0.8,
			"canvasHeight": size,
			"pieOuterRadius": "90%"
		},
			"data": {
			"sortOrder": "value-desc",
			"content": data,
		},
		"tooltips": {
			"enabled": true,
			"type": "placeholder",
			"string": "{label}: \n{value} ({percentage}%)"
		},
		"labels": {
			"outer": {
				"format": "none"
			},
			"inner": {
				"format": "label-percentage2",
				"hideWhenLessThanPercentage": 8
			},
			"mainLabel": {
				"fontSize": 16,
				"color": "black"
			},
			"percentage": {
				"color": pColor,
				"decimalPlaces": 0
			},
			"value": {
				"color": "#adadad",
				"fontSize": 10
			}
		},
		'callbacks': {
			'onClickSegment': function(segment) {
				setLocationHash({ fG: segment.data.label, view: 'results'});
			}
		}
	});
}

