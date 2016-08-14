var http = require("http");
var url = require("url");
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");
var queryString=require("querystring");
var Iconv = require('iconv').Iconv;

var counter = {
	tweet: 1,
	comment: 1
};

var reply365 = {
	init: function(req, callback){
		var me = this;
		//log数据
		this.logs = [];

		this.errno = {
			"0": "ok",
			"1": "网络错误",
			"2": "微博有匹配，但不是最新",
			"3": "微博无匹配",
			"4": "发送请求超时",
			"5": "接受数据超时",
			"6": "结束",
			"7": "暂无评论",
			"8": "有评论了！"
		};

		//this.url = url.parse(req.url);
		this.url = 'http://www.pk2015.net/index.asp?class=4&t=' + new Date()
		//this.query 包含目标uid
	    // this.query = req.body;
	     this.callback = callback;


	    //设置抓取参数

		//设置发送请求的超时时间 ms
		this.requestLimit = {
			data: 100000
		};

		//设置后端返回数据的超时时间 ms
		this.responseLimit = {
			data: 10000
		};

		//开始干活！
		this.log("开始干活！");

		this.getData();
	},

	getData: function(){
		var me = this;
		var reqTimeout, resTimeout, req;
		me.log("开始第" + counter.tweet +"次抓取最新微博...");
		var url = me.url;
		var buffers = [], size = 0;
		req = http.get(url, function(response){
			me.clear(reqTimeout);
			//resTimeout = me.responseTimeOut(response, me.responseLimit.data);
			var source = "";
			response.on("data", function(buffer){
				buffers.push(buffer);
        size += buffer.length;
			});
			response.on("end", function(){
				me.clear(resTimeout);
				var buffer = new Buffer(size), pos = 0;
				for(var i = 0, l = buffers.length; i < l; i++) {
            buffers[i].copy(buffer, pos);
            pos += buffers[i].length;
        }
				me.log("获取微博成功！");
				counter.tweet ++;

				var gb18030_to_utf8_iconv = new Iconv('GB18030', 'UTF-8');
			 var utf8_buffer = gb18030_to_utf8_iconv.convert(buffer);
			 source = utf8_buffer.toString();
			 var $ = cheerio.load(source);
			 var $list = $('div[class^=trcolor]');
			 var result = [];
			 $list.each(function(index){
				 $this = $(this);
				 $img = $this.find('img[alt=精华主题]');
				 if($img.length){
					 var $name = $this.find('a[href^="So.asp"]');
					 var $title = $this.find('ul[style="margin-left:40px;"]');
					 var $goal = $this.find('ul[style="margin-left:80px;"]');
					 var rel = {
						 name: '',
						 title: [],
						 goal: []
					 }
					 rel.name = $name.eq(0).text();
					 $title.each(function(){
						 var text = $(this).find('a[href^=Club_Thread]').text();
						 if(true){
							 var allText = $(this).text();
							 text += allText.match(/(\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2})/)[0]
							 rel.title.push(text);
							 rel.goal.push('----');
						 }
					 })
					 $goal.each(function(index, item){
						 var text = $(this).find('a[href^=Club_Thread]').text();
						 rel.goal[$title.length - $goal.length + index ] = text;
					 })
					 result.push(rel);
				 }
			 });
				me.target = result;
				me.done(0)
			});
		}).on("error", function(e){
			me.log("抓取微博错误信息：" + e, 1);
			me.clear(reqTimeout);
			me.clear(resTimeout);
		});

		//reqTimeout = me.requestTimeOut(req, me.requestLimit.data);
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

	log: function(content, errno){
		var log = {
			time: this.showTime(),
			content: content
		};
		this.logs.unshift(log);
		if(errno){
			this.done(errno);
		}
	},

	requestTimeOut: function(req, during, callback){
		var me = this;
		me.log("正在发送请求....");
		var timeout = setTimeout(function(){
			req.abort();
			me.log("发送请求超时，重新发送~", 4);
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	responseTimeOut: function(res, during, callback){
		var me = this;
		me.log("正在接受返回数据....");
		var timeout = setTimeout(function(){
			res.destroy();
			me.log("接受数据超时，重新发送~", 5);
			callback && callback.call(me);
		}, during);
		return timeout;
	},

	clear: function(timer){
		clearTimeout(timer);
	},

	/*
	** 返回错误请求信息
	 */
	error: function(errno){
		this.done();
	},

	done: function(errno){
		//添加间隔
		this.logs.push({
			blank: 1
		});
		this.callback({
			errno: errno,
			target: this.target,
			logs: this.logs
		});
	}
};


module.exports = reply365;
