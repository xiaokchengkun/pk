var services = angular.module("reply365.services", []);

services.factory("reply365Service", ["$http",
	function($http){
		var viewsUrl = "/static/views";
		var reply365Service = {
			target: {
				uid: "", //目标个人主页的uid
				rid: "", //目标最新微博的tid
				random: Math.random()
			},

			selected: {
			}
		};

		var clientUrlMap = {
			tweet: "/ajax/reply365/gettweet"
		};

		var scope = reply365Service;

		$.extend(reply365Service, {
			//从后段接数据
			getData: function(type, query){
				return $http.post(clientUrlMap[type], query).success(function(response){
					var errno = response.errno;
					var target = response.target;
					var tops = {};
					$.each(target, function(index, item){
						var title = item.title
						var goal = item.goal
						item.data = [];
						tops[item.name] = {
							redCount: []
						};
						$.each(title, function(i, t){
							t = t.replace(/\s+/g, ' ');
							publish = t.match(/(\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2})/)[0];
							t = t.replace(publish, '');
							var list = t.split(' ');
							var result = goal[i];
							var isRed = result.match(/(w|W|赢|红)/);
							var unit = {
								union: list[0],
								time: list[1],
								team: t.replace(list[0] + ' ' + list[1], ''),
								publish: publish,
								result: result,
								isRed: isRed
							};
							if(isRed){
								tops[item.name].redCount.push('|');
							}
							item.data.push(unit);
							if(!isRed && unit.team.indexOf('QQ') === -1 && unit.team.indexOf('连胜') === -1){
								var delta = new Date().getTime() - new Date(unit.publish).getTime();
								if(delta < 1000 * 60 * 60 * 20){
									$.extend(tops[item.name], unit);
								}
							}
						});
					});
					$.extend(true, scope.target, {
						results: target,
						tops: tops
					});
				});
			}
		});

		return reply365Service;
	}
]);
