/**
 * Module dependencies.
 */
var express = require('express')
, http = require('http')
, path = require('path')
, amqp = require('amqp')
, request = require('request')
  , io = require('socket.io')
  , _ = require('underscore')
;

// Create an express app
var app = express();

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use('/components', express.static(path.join(__dirname, 'components')));

});
var watchList = {
		type: "company",
	    total: 0,
	    tweetScore: {},
	    symbols: {},
	    lastTweetTime: {},
	    initialScores: {},
	    initialPrices: {},
	    prices: {},
	    wordcloud: "all",
	    topWords: {},
	    wordCloudFrozen: "false"
};
var watchListIndustries = {
		type: "industry",
	    total: 0,
	    tweetScore: {},
	    symbols: {},
	    lastTweetTime: {},
	    initialScores: {},
	    initialPrices: {},
	    prices: {},
	    topWords: {},
	    wordcloud: "all",
	    pricesIndividualCompanies: {},
	    topWordsIndividualCompanies:{},
	    wordCloudFrozen: "false"
};
var currentWatchList = watchList;
  
app.get('/', function(req, res) {
	currentWatchList = watchList;
	res.render('index', { data: currentWatchList  });
	sockets.sockets.emit('wordcloud', currentWatchList);
});
app.get('/industries', function(req, res) {
	currentWatchList = watchListIndustries;
	res.render('index', { data: currentWatchList });
	sockets.sockets.emit('wordcloud', currentWatchList);
});
app.rabbitMqConnection = amqp.createConnection({
	host : 'localhost'
});
app.rabbitMqConnection.on('ready', function() {
	app.e = app.rabbitMqConnection.exchange('twittertrader-exchange');
	app.q = app.rabbitMqConnection.queue('twitter.trader');
	app.q.bind(app.e, '#');
	app.q.subscribe(function(msg) {
		var update= JSON.parse(msg.data.toString());
		if(update.type == "companyTweet"){
		  watchList.tweetScore[update.companySymbol] = update.tweetScore;	
	  	  watchList.symbols[update.companySymbol] += update.tweetScore;
	  	  watchList.lastTweetTime[update.companySymbol] = new Date().getTime();
		  watchList.total++;
		  watchListIndustries.tweetScore[update.industry] = update.tweetScore;	
		  watchListIndustries.symbols[update.industry] += update.tweetScore;
		  watchListIndustries.lastTweetTime[update.industry] = new Date().getTime();
		  watchListIndustries.total++;
		  sockets.sockets.emit('data', currentWatchList);
		}
		if(update.type == "stockPrice"){
			watchList.prices[update.companySymbol] = update.stockPrice;
			watchListIndustries.pricesIndividualCompanies[update.industry].prices[update.companySymbol] = update.stockPrice;
			watchListIndustries.prices[update.industry]=0;
			_.each(watchListIndustries.pricesIndividualCompanies, function(element,index,industries) {
				if(index == update.industry){
	    			_.each(element.prices, function(element2,index2, industries2){
		    			watchListIndustries.prices[index]+=element2;
		    		});
	    		}
			});
			sockets.sockets.emit('data', currentWatchList);
		}
		if(update.type == "topWords"){
			watchList.topWords[update.companySymbol] = update.topWords;
			watchListIndustries.topWordsIndividualCompanies[update.industry].topWords[update.companySymbol]=update.topWords;
			watchListIndustries.topWords[update.industry]=[];
			_.each(watchListIndustries.topWordsIndividualCompanies, function(element,index,industries) {
				if(index == update.industry){
	    			_.each(element.topWords, function(element2,index2, industries2){
		    			_.each(element2, function(element3,index3,industries3){
		    				
		    				watchListIndustries.topWords[index].push(element3)
		    			})
		    		});
	    		}
			});
			if(currentWatchList.wordCloudFrozen=="false"){
				sockets.sockets.emit('wordcloud', currentWatchList)
			}
			
		}
	});
});
var server = http.createServer(app);
var sockets = io.listen(server);
sockets.set('log level',1);
// If the client just connected, give them fresh data!
sockets.sockets.on('connection', function(socket) { 
	socket.on('changeWordCloud',function(data){
		currentWatchList.wordcloud = data.id;
		socket.emit('wordcloud', currentWatchList);
	});
	socket.on('freezeWordCloud',function(){
		if(watchList.wordCloudFrozen == "false"){
			watchList.wordCloudFrozen = "true"
			watchListIndustries.wordCloudFrozen = "true";
		}else {
			watchList.wordCloudFrozen = "false"
			watchListIndustries.wordCloudFrozen = "false";
		}
	});
  socket.emit('data', currentWatchList);
});
request.get('http://localhost:8080/twittertrader/company/getAllCompanies',function(error, response, body){
	if(error){
		console.log(error);
	}else if (!error && response.statusCode != 200) {
		console.log("There has been a problem"+ response.statusCode);
    }else {
    	var industryList = [];
    	companies = JSON.parse(body);
    	_.each(companies, function(v) {
    		watchList.tweetScore[v.stockSymbol] = 0;
    		watchList.symbols[v.stockSymbol] = v.companyScore;
    		watchList.initialScores[v.stockSymbol] = v.companyScore;
    		watchList.prices[v.stockSymbol]=v.stockPrice;
    		watchList.initialPrices[v.stockSymbol]=v.stockPrice;
    		watchList.lastTweetTime[v.stockSymbol]= new Date();
    		watchList.topWords[v.stockSymbol]= {};
    		
    		// maybe an ifstatement to initialise if previously not set
    		if(_.contains(industryList, v.industry)){
    			watchListIndustries.symbols[v.industry] +=v.companyScore;
        		watchListIndustries.initialScores[v.industry] +=v.companyScore;
        		watchListIndustries.initialPrices[v.industry]+=v.stockPrice;
        		watchListIndustries.pricesIndividualCompanies[v.industry].prices[v.stockSymbol]=v.stockPrice;
        		watchListIndustries.topWordsIndividualCompanies[v.industry].topWords[v.stockSymbol]={};
    		} else{
    			watchListIndustries.tweetScore[v.industry]=0;
    			watchListIndustries.symbols[v.industry] =v.companyScore;
        		watchListIndustries.initialScores[v.industry] =v.companyScore;
        		if(! watchListIndustries.pricesIndividualCompanies[v.industry] )
        		  watchListIndustries.pricesIndividualCompanies[v.industry] ={prices:{}};
        		watchListIndustries.pricesIndividualCompanies[v.industry].prices[v.stockSymbol]=v.stockPrice;
        		if(! watchListIndustries.topWordsIndividualCompanies[v.industry] )
          		  watchListIndustries.topWordsIndividualCompanies[v.industry] ={topWords:{}};
          		watchListIndustries.topWordsIndividualCompanies[v.industry].topWords[v.stockSymbol]={};
        		watchListIndustries.initialPrices[v.industry]=v.stockPrice;
        		watchListIndustries.lastTweetTime[v.industry]= new Date();
        		watchListIndustries.topWords[v.industry]= [];
        		watchListIndustries.prices[v.industry]= 0;
        		industryList.push(v.industry);
    		}
    		
    	});
    	_.each(watchListIndustries.pricesIndividualCompanies, function(element,index,industries) {
    		_.each(element.prices, function(element2,index2, industries2){
    			watchListIndustries.prices[index]+=element2;
    		});
		});
    	console.log("Companies successfully received");
    	request.get('http://localhost:8080/twittertrader/twitter/start/'+3,
    			  function(error, response, body){
    				if(error){
    					console.log(error);
    				}else if (!error && response.statusCode != 200) {
    					console.log(response);
    			    }else{
    			    	console.log("Successfully started streaming");
    			    }
    	});
    }	
});
  
server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
