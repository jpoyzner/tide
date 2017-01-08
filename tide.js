//http://www.networkerror.org/component/content/article/1-technical-wootness/44-googles-undocumented-finance-api.html

var http = require('http');
var tickers = require('./tickers');

//var googleFinance = require('google-finance');
//
//var date = new Date();
//date.setHours(6);
//date.setMinutes(30);
//date.setDate(6);
//
//var endDate = new Date();
//endDate.setHours(13);
//endDate.setMinutes(30);
//endDate.setDate(6);


/*
 * FRIDAY
 * 1min: 1.2%
 * 2min: 3.1%
 * 5min: 1.18%
 * 10min: 0.7%
 * 15min: -0.3%
 * 20min: 2.2%
 * 25min: 1.9%
 * 30min: -.9%
 * 60min: 0.9%
 */

/*
 * 3 weeks
 * 1min: 12.2%
 * 2min: 29.1%
 * 5min: 38.6%
 * 10min: 30.4%
 * 15min: 29.5%
 * 20min: 32.6%
 * 25min: 25.4%
 * 30min: 7.3%
 * 60min: -4%
 * 2hours: -6.7%
 */

var totalMins = 4922 * 60;
var timeFrame = 120 * 60;

var history = {};

var getStock = function(tickerIndex, callback) {
	if (tickerIndex >= tickers.length) {
		callback();
		return;
	}
	
	var ticker = tickers[tickerIndex].ticker;
	history[ticker] = [];
	
	http.get({host: 'www.google.com', port: 80, path: '/finance/getprices?x=NASDAQ&i=' + timeFrame + '&p=15d&f=h&q=' + ticker}, function(response) {
	//googleFinance.historical({symbol: ticker, from: date}, function(err, quotes) {
		response.setEncoding('utf8');
		var data = "";
					
		response.on('data', function(chunk) {
			data += chunk;
		});
		
		response.on('end', function() {
			console.log("GETTING: " + ticker);
			
			if (data.length > 0) {
				var lines = data.split('\n');
			    for(var line = 7; line < lines.length; line++){
			    	history[ticker].push(parseFloat(lines[line]));
			    }
				
				//date.setMinutes(date.getMinutes() + 1);
				getStock(++tickerIndex, callback);
			} else {
				callback();
			}
		});
	});
}	

getStock(0, function() {
	var gain = 0;
	var bestMover;
	var bestMovement;
	
	for (var i = 0; i < totalMins / timeFrame; i++) {
		if (bestMover && i > 0) {
			var lastPrice = history[bestMover][i - 1];
			gain += (history[bestMover][i] - lastPrice) / lastPrice;
		}
		
		bestMovement = 0; //in percent

		console.log("SLICE " + i + " ---------------------------------------------------------")
		tickers.forEach(function(ticker) {
			var price = history[ticker.ticker][i];
			if (i > 0) {
				var lastPrice = history[ticker.ticker][i - 1];
				var diff = (price - lastPrice) / lastPrice;
				if (diff > bestMovement) {
					bestMovement = diff;
					bestMover = ticker.ticker;
				}
			}
		});
		
		console.log("BEST MOVER: " + bestMover + ", MOVEMENET: " + (bestMovement * 100) + "%");
		console.log("RUNNING GAIN: " + (gain * 100) + "%");
	}
});