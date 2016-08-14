var http = require("http");
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");
var forever = require("forever");
var querystring=require("querystring");
// 载入模块
var Segment = require('node-segment').Segment;
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();

var checkTweet = {
	init: function(){
		var me = this;
		var date = moment();
		this.time = {
			h: date.hour(),
			m: date.minute(),
			s: date.second()
		};

		this.urls = [
			'http://www.pk2015.net/index.asp?class=4'
		]

		//轮询次数
		this.counter = {
			data: 1,
			comment: 1
		};

		//设置发送请求的超时时间 ms
		this.requestLimit = {
			data: 10000,
			comment: 100000
		};

		//设置后端返回数据的超时时间 ms
		this.responseLimit = {
			data: 10000,
			comment: 10000
		};

		//开始干活！
		this.setIntervalGetData();
		this.log("开始干活！");

		//this.login();
	},

	setIntervalGetData: function(){
		var me = this;
		this.timerGetData = setTimeout(function(){
			var status = true;
			if(status){
				me.log(me.showTime(),"开始轮询");
				me.getData();
				me.counter.data++;
			}
		}, this.getDataTime);
	},

	getData: function(){
		var me = this;
		var reqTimeout, resTimeout, req;
		me.log("开始第" + me.counter.data +"次抓取最新微博...");
		var url = me.urls[0];
		req = http.get(url, function(response){
			me.clear(reqTimeout);
			resTimeout = me.responseTimeOut(response, me.responseLimit.data, me.getData);
			var source = "";
			response.on("data", function(data){
				source += data;
				console.log('data:', data);
			});
			response.on("end", function(){
				me.clear(resTimeout);
				me.log("获取微博成功！");
				var $ = cheerio.load(source);
				console.log(source);
			});
		}).on("error", function(e){
			me.log("抓取微博错误信息：" + e);
			me.stopDataInterval();
			me.getData();
			me.clear(reqTimeout);
			me.clear(resTimeout);
		});

		reqTimeout = me.requestTimeOut(req, me.requestLimit.data, me.getData);
	},


	stopDataInterval: function(){
		this.log("停止抓取微博！！！！");
		clearInterval(this.timerData);
	},

	stopCommentInterval: function(){
		this.log( "停止抓取评论！！！！");
		clearInterval(this.timerComment);
	},

	showTime: function(){
		var date = moment();
		var time = {
			h: date.hour(),
			m: date.minute(),
			s: date.second()
		};
		return (time.h + ":" + time.m + ":" + time.s);
	},

	log: function(content){
		console.log(this.showTime(), content, "\n");
	},

	requestTimeOut: function(req, during, callback){
		var me = this;
		me.log("正在发送请求....");
		var timeout = setTimeout(function(){
			req.abort();
			me.log("发送请求超时，重新发送~");
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	responseTimeOut: function(res, during, callback){
		var me = this;
		me.log("正在接受返回数据....");
		var timeout = setTimeout(function(){
			res.destroy();
			me.log("接受数据超时，重新发送~");
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	clear: function(timer){
		clearTimeout(timer);
	},

	restart: function(){
		this.log("请求出错，重新启动程序。");
	}
};

checkTweet.init();
