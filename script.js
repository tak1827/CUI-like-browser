$(function() {

    init();

    // Detect enter key press
    $("#cmd-input").keypress(function(e) {
        if (e.which == 13) {
        	var $self = $(this);
            var cmd = encodeURIComponent($(this).val());
            // Execute command
            ajax(cmd, function(output) {
            	$self.val('');// initialize input erea
                output = output.replace(/\n/g, "<br>"); // Replace '\n' into '<br>'
                output = output.replace(/\t/g, "&nbsp;&nbsp;"); // Replace tab into 2 half-width space
                output = output.replace(/ /g, "&nbsp;"); // Replace ' ' into half-width space
                $("#cmd-output").append(output); // Insert output
                window.scrollTo(0, document.body.scrollHeight); // Move to bottom
            });
        }
    });
});


// Configrations
var config = {
    ip: 'localhost',
    port: '8081',
};


/**
 * initializer
 */
function init() {
    ajax('initialize-connection', function(data) {
        $("#cmd-output").append(data);
        $("#contents").show();
    });
}


/**
 * Exec ajax
 * @param cmd -> command, doneFunc -> callback when success
 */
function ajax(cmd, doneFunc) {
    $.ajax({
        type: "GET",
        url: "http://" + config.ip + ":" + config.port + "/" + cmd,
        dataType: "html",
        cache: false,
    }).done(function(data, textStatus) {
        doneFunc(data, textStatus);
    }).fail(function(xhr, textStatus, errorThrown) {
        console.log(xhr);
    });
}
