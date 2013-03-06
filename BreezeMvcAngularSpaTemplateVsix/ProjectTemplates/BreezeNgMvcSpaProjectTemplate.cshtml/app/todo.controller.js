/* Defines the "todo view" controller
 * Constructor function relies on Ng injector to provide:
 *     $scope - context variable for the view to which the view binds
 *     breeze - breeze is a "module" known to the injectory thanks to main.js
 *     datacontext - injected data and model access component (todo.datacontext.js)
 *     logger - records notable events during the session (about.logger.js)
 */
todo.controller('TodoCtrl',
    ['$scope', 'breeze', 'datacontext', 'logger',
    function ($scope, breeze, datacontext, logger) {

        logger.log("creating TodoCtrl");
        var removeList = breeze.core.arrayRemoveItem;

        $scope.todoLists = [];
        $scope.error = "";
        $scope.getTodos = getTodos;
        $scope.refresh = refresh;
        $scope.endEdit = endEdit;
        $scope.addTodoList = addTodoList;
        $scope.deleteTodoList = deleteTodoList;
        $scope.clearErrorMessage = clearErrorMessage;

        // load TodoLists immediately (from cache if possible)
        $scope.getTodos();

        //#region private functions 
        function getTodos(forceRefresh) {
            datacontext.getTodoLists(forceRefresh)
                .then(getSucceeded).fail(failed).fin(refreshView);
        }
        function refresh() { getTodos(true); }

        function getSucceeded(data) {
            $scope.todoLists = data;
        }
        function failed(error) {
            $scope.error = error.message;
        }
        function refreshView() {
            $scope.$apply();
        }
        function endEdit(entity) {
            datacontext.saveEntity(entity).fin(refreshView);
        }
        function addTodoList() {
            var todoList = datacontext.createTodoList();
            todoList.isEditingListTitle = true;
            datacontext.saveEntity(todoList)
                .then(addSucceeded)
                .fail(addFailed)
                .fin(refreshView);

            function addSucceeded() {
                showAddedTodoList(todoList);
            }

            function addFailed(error) {
                failed({ message: "Save of new todoList failed" });
            }
        }
        function deleteTodoList(todoList) {
            removeList($scope.todoLists, todoList);
            datacontext.deleteTodoList(todoList)
                .fail(deleteFailed)
                .fin(refreshView);

            function deleteFailed() {
                showAddedTodoList(todoList); // re-show the restored list
            }
        }
        function clearErrorMessage(obj) {
            if (obj && obj.errorMessage) {
                obj.errorMessage = null;
            }
        }
        function showAddedTodoList(todoList) {
            $scope.todoLists.unshift(todoList); // Insert todoList at the front
        }
        //#endregion
    }]);