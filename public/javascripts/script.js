$(function() {
    var socket = io.connect(window.location.hostname);
    socket.on('data', function(data) {
        var total = data.total;
        for (var key in data.symbols) {
            var val = data.tweetScore[key];
            if (isNaN(val)) {
                val = 0;
            }
            if( val < 0) {
              $('li[data-symbol="' + key + '"]').each(function() {
                $(this).css('background-color', 'rgb(255,0,0)');
              });
            } else if(val > 0){
            	$('li[data-symbol="' + key + '"]').each(function() {
                    $(this).css('background-color', 'rgb(0,0,255)');
                  });
            } else{
            	$('li[data-symbol="' + key + '"]').each(function() {
                    $(this).css('background-color', 'rgb(0,0,0)');
                  });
            }
            $('#stockPrice'+key).text(data.prices[key].toFixed(2));
            $('#stockPriceChange'+key).text("("+(((data.prices[key]-data.initialPrices[key])/data.initialPrices[key])*100).toFixed(2)+"%)");
            $('#scoreChange'+key).text("("+(((data.symbols[key]-data.initialScores[key])/data.initialScores[key])*100).toFixed(2)+"%)");
        }
        $('#last-update').text(new Date().toTimeString());
    });
})