var controllers = angular.module("reply365.controllers", []);

var urlMap = {
	start: "/ajax/reply365/start",
	stop: "/ajax/reply365/stop"
};


controllers.controller("reply365Controller", ["$scope", "reply365Service", "$filter",
	function($scope, reply365Service, $filter){

		$scope.target = reply365Service.target;

		$scope.musics = reply365Service.musics;

		$scope.logs = reply365Service.logs;

		$scope.selected = reply365Service.selected;

		$scope.pages = [
			{
				url: 'http://www.pk2015.net/index.asp?class=4',
				name: '新利18比赛区'
			}
		]

		$scope.status = {
			tweet: {
				isStop: true,
				isProgress: false
			},
			audio: {
				isReady: false,
				isPlay: false,
				isStop: true
			}
		};
		$scope.timer = {};

		$scope.start = function(type){
			$scope.status[type].isStop = false;
			$scope.audio.stop();
			$scope.getTweet();
			setInterval(function(){
				$scope.getTweet();
			}, 1000 * 60 *5);
		};

		$scope.getTweet = function(){
			var query = {
				uid: $scope.target.uid
			};
			reply365Service.getData("tweet", query).then(function(http){
				var response = http.data;
				$scope.updateTime = $filter('date')(new Date(), 'medium');
				if($.isPlainObject(response)){
					if(response.errno == 6){
					//if(response.errno == 3 || response.errno == 2 || response.errno == 6){
						$scope.status.tweet.isStop = true;

						$scope.audio.play();
						//来个桌面提醒
						//alert("有新消息！");
						$scope.notice("tweet");

						$scope.start("comment");
					}
					else if(response.errno && !$scope.status.tweet.isStop){
						$scope.again("tweet");
					}
				}else{
					console.log('again');
					$scope.again("tweet");
				}
			});
		};


		$scope.stop = function(type){
			$scope.status.tweet.isStop = true;
			$scope.status.tweet.isProgress = false;

			clearTimeout($scope.timer[type]);
			$scope.timer[type] = null;
		};

		$scope.again = function(type){
			$scope.status.tweet.isProgress = true;
			$scope.timer.tweet = setTimeout(function(){
				$scope.status.tweet.isProgress = false;
				$scope.getTweet();
			}, 15000);
		};

		$scope.audio = {
			play: function(){
				if($scope.status.audio.isReady){
					$scope.status.audio.isPlay = true;
					$scope.status.audio.isStop = false;
				}
			},
			stop: function(){
				if($scope.status.audio.isReady){
					$scope.status.audio.isPlay = false;
					$scope.status.audio.isStop = true;
				}
			}
		};

		$scope.notice = function(type){
			var title,
				link,
				options = {
					dir: "ltr",
					icon: "http://timg.cmwb.com/face/temp/middlehead.jpg"
				};
			switch(type){
				case "tweet":
					title = "有新信息了!!!";
					options.body = $scope.target.content || "";
					link = "https://www.google.com/search?q=" + $scope.target.question;
					break;
				default:
					title = "！！！！";
					options.body = "有新信息出现~";
			}
			if(options.body == $scope.cache){
				return;
			}

			$scope.cache = options.body;

			var notificationAction = function(){
				var notification = new Notification(title, options);
				notification.onclick = function(){
					window.open(link);
				};
			};

			if (!("Notification" in window)) {
				alert(title);
			}
			else if (Notification.permission === "granted") {
				notificationAction();
			}
			else if (Notification.permission !== 'denied') {
				Notification.requestPermission(function (permission) {
					if(!('permission' in Notification)) {
						Notification.permission = permission;
					}
					if (permission === "granted") {
						notificationAction();
					}
				});
			}
		};


		//$scope.start('tweet');
	}
]);


controllers.directive("audioRemind", ["reply365Service",
	function(reply365Service){
		return {
			link: function(scope, element, attrs){
				scope.selected = reply365Service.selected;
				var $element = $(element);
				$(element).on("load", function(){
					scope.status.audio.isReady = true;
				});
				var src = scope.selected.music.uid;
				$element.attr({
					controls: "true",
					src: src,
					type: "audio/mpeg",
					loop: "true"
				});
				//element.load();

				scope.$watch("selected.music", function(){
					var src = scope.selected.music.uid;
					$element.attr("src", "").attr("src", src);
				});

				scope.$watch("status.audio", function(){
					console.log(scope.status.audio);
					if(!scope.status.audio.isReady){
						return;
					}
					if(scope.status.audio.isStop){
						$(element)[0].pause();
						$element.attr("src", "").attr("src", src);
					}
					if(scope.status.audio.isPlay){
						$(element)[0].play();
					}
				}, true);
			}
		};
	}
]);
