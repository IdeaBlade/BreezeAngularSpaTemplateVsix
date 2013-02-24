/* datacontext: data access and model management layer */

// create and add datacontext to the Ng injector
// constructor function relies on Ng injector to provide 
// breeze, model, and Ng-timeout services
todo.factory('datacontext',
    ['breeze', 'model', '$timeout',
    function (breeze, model, $timeout) {

        // Configure to use the model library for Angular
        breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true);
        breeze.NamingConvention.camelCase.setAsDefault();

        var manager = new breeze.EntityManager("api/Todo");
        manager.enableSaveQueuing(true);

        var datacontext = {
            metadataStore: manager.metadataStore,
            getTodoLists: getTodoLists,
            createTodoList: createTodoList,
            createTodoItem: createTodoItem,
            deleteTodoItem: deleteTodoItem,
            deleteTodoList: deleteTodoList,
            saveEntity: saveEntity
        };

        model.initializeModel(datacontext);
        return datacontext;

        //#region Private Members
        function getTodoLists() {
            return breeze.EntityQuery
                .from("TodoLists").expand("Todos")
                .orderBy("todoListId desc")
                .using(manager).execute()
                .then(getSucceeded); //caller must handle failure

            function getSucceeded(data) {
                return data.results;
            }
        }

        function createTodoItem() {
            return manager.createEntity("TodoItem");
        }

        function createTodoList() {
            return manager.createEntity("TodoList");
        }

        function deleteTodoItem(todoItem) {
            todoItem.entityAspect.setDeleted();
            return saveEntity(todoItem);
        }

        function deleteTodoList(todoList) {
            // Neither breeze nor server cascade deletes so we have to do it
            var todoItems = todoList.todos.slice(); // iterate over copy
            todoItems.forEach(function (entity) { entity.entityAspect.setDeleted(); });
            todoList.entityAspect.setDeleted();
            return saveEntity(todoList);
        }

        function saveEntity(masterEntity) {

            return manager.saveChanges().fail(saveFailed);

            function saveFailed(error) {
                setErrorMessage(error);
                // Let user see invalid value briefly before reverting"
                $timeout(function () { manager.rejectChanges(); }, 1000);
                throw error; // so caller can see failure
            }

            function setErrorMessage(error) {
                var statename = masterEntity.entityAspect.entityState.name.toLowerCase();
                var typeName = masterEntity.entityType.shortName;
                var msg = "Error saving " + statename + " " + typeName + ": ";

                var reason = error.message;

                if (reason.match(/validation error/i)) {
                    reason = getValidationErrorMessage(error);
                }
                masterEntity.errorMessage = msg + reason;
            }

            function getValidationErrorMessage(error) {
                try { // return the first error message
                    var firstItem = error.entitiesWithErrors[0];
                    var firstError = firstItem.entityAspect.getValidationErrors()[0];
                    return firstError.errorMessage;
                } catch (e) { // ignore problem extracting error message 
                    return "validation error";
                }
            }
        }
        //#endregion
    }]);