/**
 * Module dependencies.
 */
var express = require('express'), http = require('http'), path = require('path'), amqp = require('amqp'), request = require('request');

// Create an express app
var app = express();

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.static(path.join(__dirname, 'public')));
});

var streamingPortfolio;

app.post('/login', function(req, res) {
	request.post('http://localhost:8080/twittertrader/portfolio/login',
			{ form: { username: req.body.username, password: req.body.password },
		headers: { content_type: 'application/x-www-form-urlencoded' }},
			function(error, response, body){
				if(error){
					console.log(error);
					res.render('500.jade', {
						title : 'Welcome to TwitterTrader'
					});
				}else if (!error && response.statusCode == 200) {
					currentPortfolio = JSON.parse(response.body);
					res.render('index.jade', {
						title : 'Welcome to TwitterTrader',
						portfolio : currentPortfolio
					});
		        }else {
		        	res.render('index.jade', {
						title : 'Welcome to TwitterTrader'
					});
		        }
	});
});

app.get('/', function(req, res) {
	res.render('index.jade', {
		title : 'Welcome to TwitterTrader'
	});
});

app.get('/startStream', function(req, res) {
	var portfolioID = req.query.id
	request.get('http://localhost:8080/twittertrader/twitter/start/'+portfolioID,
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
		        	res.render('index.jade', {
						title : 'Welcome to TwitterTrader'
					});
		        	streamingPortfolio = portfolioID;
		        }
	});
});

app.get('/stopStream', function(req, res) {
	var portfolioID = req.query.id
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
		        	res.render('index.jade', {
						title : 'Welcome to TwitterTrader'
					});
		        	streamingPortfolio = null;
		        }
	});
});

app.get('/index', function(req, res) {
	res.render('index.jade', {
		title : 'Welcome to TwitterTrader Dashboard',
		portfolio : app.currentPortfolio
	});
});

app.get('/portfolios', function(req, res) {
	request.get('http://localhost:8080/twittertrader/portfolio/getAllPortfolios',
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
		        	var portfolios = JSON.parse(response.body);
		        	res.render('portfolios.jade', {
						title : 'Welcome to TwitterTrader',
						portfolios : portfolios,
						streamingPortfolio : streamingPortfolio
					});
		        }
	});
});

app.get('/companies', function(req, res) {
	request.get('http://localhost:8080/twittertrader/company/getAllCompanies',
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
		        	var companies = JSON.parse(response.body);
		        	console.log(companies)
		        	res.render('companies.jade', {
						title : 'Welcome to TwitterTrader',
						companies : companies
					});
		        }
	});
});

app.get('/company', function(req, res) {
	request.get('http://localhost:8080/twittertrader/company/getCompany/'+req.query.id,
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
		        	var company = JSON.parse(response.body);
		        	console.log(company);
		        	res.render('company.jade', {
						title : 'Welcome to TwitterTrader',
						company : company
					});
		        }
	});
});

app.get('/portfolio', function(req, res) {
	request.get('http://localhost:8080/twittertrader/portfolio/getPortfolio/'+req.query.id,
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
		        	var portfolio = JSON.parse(response.body);
		        	console.log(portfolio)
		        	res.render('portfolio.jade', {
						title : 'Welcome to TwitterTrader',
						portfolio : portfolio
					});
		        }
	});
});

app.get('/industry', function(req, res) {
	request.get('http://localhost:8080/twittertrader/industry/getIndustry/'+req.query.id,
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
		        	var industry = JSON.parse(response.body);
		        	console.log(industry.companies)
		        	res.render('industry.jade', {
						title : 'Welcome to TwitterTrader',
						industry : industry
					});
		        }
	});
});

app.get('/industries', function(req, res) {
	request.get('http://localhost:8080/twittertrader/industry/getAllIndustries',
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
		        	var industries = JSON.parse(response.body);
		        	console.log(industries)
		        	res.render('industries.jade', {
						title : 'Welcome to TwitterTrader',
						industries : industries
					});
		        }
	});
});
app.get('/blank', function(req, res){
	res.render('blank_page.jade', {
						title : 'Welcome to TwitterTrader',
					});
})

app.rabbitMqConnection = amqp.createConnection({
	host : 'localhost'
});
app.rabbitMqConnection.on('ready', function() {
	app.e = app.rabbitMqConnection.exchange('twittertrader-exchange');
	app.q = app.rabbitMqConnection.queue('twitter.trader');
	app.q.bind(app.e, '#');
	app.q.subscribe(function(msg) {
		console.log(msg.data.toString());
	});
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
