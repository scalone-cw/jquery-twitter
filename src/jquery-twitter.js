
( function() {
	var SEARCH_URL = "http://search.twitter.com/search.json";
	var TRENDS_URL = "http://search.twitter.com/trends/";
	var USER_TIMELINE_URL = 'http://twitter.com/statuses/user_timeline.json';
	var PUBLIC_TIMELINE_URL = 'http://twitter.com/statuses/public_timeline.json';
	var SPECIFIC_TWEET_URL = 'http://twitter.com/statuses/show/%id%.json';
	
	function TwitterStream(term, callback, data, method){
		this.term = term;
		this.searchSpeed = 2000;
		this.paused = false;
		this.handler = null;
		this.last_id = 0;
		this.callback = callback;
		this.data = data;
		this.method = method;
		this.current = {};
	}
	TwitterStream.prototype.stop = function(){
		clearInterval(this.handler);
	};
	TwitterStream.prototype.start = function(){	
		var self = this;
		this.handler = setInterval(function(){
			if(self.paused)return;
			self.data.since_id = self.last_id;
			jQuery.twitter[self.method](self.term, self.data, function(resp){
				var results = resp.results;
				if(results.length > 0){
					$(results).each(function(num){
						if(self.current[this.id]){
							results = results.splice(num, 1);
						}else{
							self.current[this.id] = '';
						}
					});
					self.last_id = results[0].id+1;
					self.callback.call(self, resp);
				}
			});
		}, self.searchSpeed);
	}
	// bind events
	var toggleStream = function(pause){
		return function(e){
			var control = jQuery.twitter.streams[e.term];
			if(control)
				control.paused = pause;
			return false;
		};
	};
	$().bind('twitter:pause', toggleStream(true));
	$().bind('twitter:play', toggleStream(false));
	$().bind('twitter:adjust_speed', function(e){
		var stream = jQuery.twitter.streams[e.term];
		if(stream){
			stream.stop();
			stream.searchSpeed = e.speed;
			stream.start();
		}			
	});
	try {

		jQuery.twitter = {
			streams:{},
			show_status: function(id, callback){
			   var url = SPECIFIC_TWEET_URL.replace('%id%', id)+'?callback=?';
			   $.getJSON(url, callback);
			},
			user_timeline: function(user, data, callback){
				var url = USER_TIMELINE_URL + '?screen_name='+user+'&callback=?';
	            if(jQuery.isFunction(data)){
	                callback = data;
	            }else{
	                for(var k in data){
	                    url += '&'+k+'='+data[k];
	                }
	            }
		        $.getJSON(url, callback);
            },
			live_public_timeline: function(callback){
				jQuery.twitter.streams['public'] = new TwitterStream('', callback, {}, 'public_timeline');
				jQuery.twitter.streams['public'].start();
			},
			public_timeline: function(callback){
				var reqUrl = PUBLIC_TIMELINE_URL + "?callback=?";
				$.getJSON(reqUrl, callback);
			},
			trends: function(report, date, callabck){
				var reqUrl = TRENDS_URL+report+'.json?callback=?';
				if(jQuery.isFunction(date)){
					callback = date;
				}else{
					reqUrl += '&date='+date;
				}
				jQuery.getJSON(reqUrl, callback);
			},
			liveSearch: function(term, data, callback){
				jQuery.twitter.streams[term] = new TwitterStream(term, callback, data, 'search');
				jQuery.twitter.streams[term].start();
			},
			search: function(term, data, callback) {
				if (jQuery.isFunction(data)) {
					callback = data;
					data = {};
				}
				jQuery.getJSON(buildSearchUrl(term, data), callback);
			}
		};
        $(['current', 'daily', 'weekly']).each(function(){
			var type = this;
            jQuery.twitter[type] = function(callback){
				jQuery.twitter.trends(type, callback);
			};
		});

	} catch (e) {
		throw new Exception('jQuery is not defined!');
	}

	function buildSearchUrl(term, data){
		var reqUrl = SEARCH_URL + "?q=" + term + "&callback=?";
		for ( var key in data) {
			if (key == 'geocode'){
                            reqUrl += '&gecode='+data.geocode.lat+'%2C'+data.geocode.lon+'%2C'+data.geocode.radius;
                        }else{
			    reqUrl += "&" + key + "=" + data[key];
                        }
		} 
		return reqUrl;
	}
})();
