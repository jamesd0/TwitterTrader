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
	    total: 0,
	    tweetScore: {},
	    symbols: {},
	    initialScores: {},
	    initialPrices: {},
	    prices: {},
	    streaming: false
};
var streaming = false;
request.get('http://localhost:8080/twittertrader/company/getAllCompanies',function(error, response, body){
	if(error){
		console.log(error);
	}else if (!error && response.statusCode != 200) {
		console.log("There has been a problem"+ response.statusCode);
    }else {
    	companies = JSON.parse(body);
    	_.each(companies, function(v) {
    		watchList.tweetScore[v.stockSymbol] = 0;
    		watchList.symbols[v.stockSymbol] = v.companyScore;
    		watchList.initialScores[v.stockSymbol] = v.companyScore;
    		watchList.prices[v.stockSymbol]=v.stockPrice;
    		watchList.initialPrices[v.stockSymbol]=v.stockPrice;
    	});
    	console.log(companies);
    	console.log("Companies successfully received");
    }	
});
    
app.get('/', function(req, res) {
	if(!watchList.streaming==true){
		request.get('http://localhost:8080/twittertrader/twitter/start/'+3,
			function(error, response, body){
				if(error){
					console.log(error);
					res.render('500.jade', {
						title : 'Welcome to TwitterTrader'
					});
				}else if (!error && response.statusCode != 200) {
					
					res.render('500.jade', {
						title : 'Welcome to TwitterTrader'
					});
		        }else {
		        	watchList.streaming=true;
		        	res.render('index', { data: watchList });
		        }
		});
	} else {
		res.render('index', { data: watchList });
	}
});
app.get('/stopStreaming', function(req, res){
	if(watchList.streaming){
		request.get('http://localhost:8080/twittertrader/twitter/stop',
				function(error, response, body){
					if(error){
						console.log(error);
						res.render('500.jade', {
							title : 'Welcome to TwitterTrader'
						});
					}else if (!error && response.statusCode != 200) {
						
						res.render('500.jade', {
							title : 'Welcome to TwitterTrader'
						});
			        }else {
			        	watchList.streaming=false;
			        	res.render('index', { data: watchList });
			        }
			});
	}else {
		res.render('index', { data: watchList });
	}
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
		  watchList.total++;
		  sockets.sockets.emit('data', watchList);
		}
		if(update.type == "stockPrice"){
			watchList.prices[update.companySymbol] = update.stockPrice;
			sockets.sockets.emit('data', watchList);
		}
	});
});
var server = http.createServer(app);
var sockets = io.listen(server);
//If the client just connected, give them fresh data!
sockets.sockets.on('connection', function(socket) { 
  socket.emit('data', watchList);
});
server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
