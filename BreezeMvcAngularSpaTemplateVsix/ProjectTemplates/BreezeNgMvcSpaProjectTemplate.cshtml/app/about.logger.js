/* logger: logs messages of events during 
 * current user session in an in-memory log 
 */
todo.factory('logger', function () {
    
    var logEntries = [];
    var counter = 1;
    var logger = {
        log: log,
        logEntries: logEntries
    };

    return logger;
    
    function log(message, type) {
        var logEntry = {
            id: counter++,
            message: message,
            type: type || "info"         
        };
        logEntries.push(logEntry);
    }
});