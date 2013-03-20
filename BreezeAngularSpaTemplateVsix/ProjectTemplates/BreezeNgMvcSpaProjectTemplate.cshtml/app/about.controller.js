/* Defines the "about view" controller
 * Constructor function relies on Ng injector to provide:
 *     $scope - context variable for the view to which the view binds
 *     logger - logs and caches session log messages (about.logger.js)
 */
todo.controller('AboutCtrl',
    ['$scope', 'logger',
    function ($scope, logger) {
        $scope.logEntries = logger.logEntries;
    }]);