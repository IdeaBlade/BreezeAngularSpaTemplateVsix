/* Defines the "todo view" controller
 * Constructor function relies on Ng injector to provide:
 *     $scope - context variable for the view to which the view binds
 *     breeze - breeze is a "module" known to the injectory thanks to main.js
 *     datacontext - injected data and model access component (datacontext.js)
 */
todo.controller('TodoCtrl',
    ['$scope', 'breeze', 'datacontext',
    function ($scope, breeze, datacontext) {

        var removeList = breeze.core.arrayRemoveItem;

        $scope.todoLists = [];
        $scope.error = "";
        $scope.endEdit = function (entity) {
            datacontext.saveEntity(entity).fin(refreshView);
        };
        $scope.clearErrorMessage = function (obj) {
            if (obj && obj.errorMessage) {
                obj.errorMessage = null;
            }
        };
        $scope.addTodoList = function () {
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
        };
        $scope.deleteTodoList = function (todoList) {
            removeList($scope.todoLists, todoList);
            datacontext.deleteTodoList(todoList)
                .fail(deleteFailed)
                .fin(refreshView);

            function deleteFailed() {
                showAddedTodoList(todoList); // re-show the restored list
            }
        };

        // Get the TodoLists now
        datacontext.getTodoLists()
                    .then(getSucceeded).fail(failed).fin(refreshView);


        //#region private functions 
        function getSucceeded(data) {
            $scope.todoLists = data;
        }
        function failed(error) {
            $scope.error = error.message;
        }
        function showAddedTodoList(todoList) {
            $scope.todoLists.unshift(todoList); // Insert todoList at the front
        }
        function refreshView() {
            $scope.$apply();
        }
        //#endregion
    }]);