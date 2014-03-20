$(function() {
	var socket = io.connect(window.location.hostname);
	socket
			.on(
					'data',
					function(data) {
						$('li').removeClass('active');
						if(data.type=='company'){
							$('li[id="company"]').addClass('active');
						}else{
							$('li[id="industry"]').addClass('active');
						}
						if(data.wordCloudFrozen=="true"){
							$('li[id="freeze"]').addClass('active');
						}
						$('li[id="'+data.wordcloud+'"]').addClass('active');
						var total = data.total;
						var wordcloudList = [];
						for ( var key in data.symbols) {
							var val = data.tweetScore[key];
							if (isNaN(val)) {
								val = 0;
							}
							var previousTweetTime = data.lastTweetTime[key];
							var currentTime = new Date().getTime();
							var differenceInMilliSeconds = (currentTime - previousTweetTime) / 10;
							if (val < 0) {
								$('liA[data-symbol="' + key + '"]')
										.each(
												function() {
													$(this)
															.css(
																	'background-color',
																	'rgb('
																			+ 255
																			/ differenceInMilliSeconds
																			+ ',0,0)');
												});
							} else if (val > 0) {
								$('liA[data-symbol="' + key + '"]')
										.each(
												function() {
													$(this)
															.css(
																	'background-color',
																	'rgb(0,0,'
																			+ 255
																			/ differenceInMilliSeconds
																			+ ')');
												});
							} else {
								$('liA[data-symbol="' + key + '"]').each(
										function() {
											$(this).css('background-color',
													'rgb(0,0,0)');
										});
							}
							$('#stockPrice' + key).text(
									data.prices[key].toFixed(2));
							$('#stockPriceChange' + key)
									.text(
											"("
													+ (((data.prices[key] - data.initialPrices[key]) / data.initialPrices[key]) * 100)
															.toFixed(2) + "%)");
							$('#scoreChange' + key)
									.text(
											"("
													+ (((data.symbols[key] - data.initialScores[key]) / data.initialScores[key]) * 100)
															.toFixed(2) + "%)");

						}
						$('#last-update').text(new Date().toTimeString());

					});
	socket.on('wordcloud', function(data) {
		$('li').removeClass('active');
		if(data.type=='company'){
			$('li[id="company"]').addClass('active');
		}else{
			$('li[id="industry"]').addClass('active');
		}
		if(data.wordCloudFrozen=="true"){
			$('li[id="freeze"]').addClass('active');
		}
		$('li[id="'+data.wordcloud+'"]').addClass('active');
		var wordcloudList = [];
		for ( var key in data.symbols) {
			if (data.wordcloud == "all" || key == data.wordcloud) {
				for ( var item in data.topWords[key]) {
					
					for ( var temp in data.topWords[key][item]) {
						wordcloudList.push([ temp,
								data.topWords[key][item][temp] ]);
						console.log(temp);
					}
				}
			}
		}
		WordCloud(document.getElementById('canvas'), {
			list : wordcloudList
		});
	})
})
function MyFunction(value){
	var socket = io.connect(window.location.hostname);
	socket.emit('changeWordCloud',{id: value});
}
function Freeze(){
	var socket = io.connect(window.location.hostname);
	socket.emit('freezeWordCloud');
}