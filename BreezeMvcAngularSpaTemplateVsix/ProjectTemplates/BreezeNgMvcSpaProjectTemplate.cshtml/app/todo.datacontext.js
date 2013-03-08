/* datacontext: data access and model management layer */

// create and add datacontext to the Ng injector
// constructor function relies on Ng injector
// to provide service dependencies
todo.factory('datacontext',
    ['breeze', 'Q', 'model', 'logger', '$timeout',
    function (breeze, Q, model, logger, $timeout) {

        logger.log("creating datacontext");
        var initialized;

        configureBreeze();
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
        model.initialize(datacontext);
        return datacontext;

        //#region private members

        function getTodoLists(forceRefresh) {

            var query = breeze.EntityQuery
                .from("TodoLists")
                .expand("Todos")
                .orderBy("todoListId desc");

            if (initialized && !forceRefresh) {
                query = query.using(breeze.FetchStrategy.FromLocalCache);
            }
            initialized = true;

            return manager.executeQuery(query)
                .then(getSucceeded); // caller to handle failure
        }

        function getSucceeded(data) {
            var qType = data.XHR ? "remote" : "local";
            logger.log(qType + " query succeeded");
            return data.results;
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
            // if nothing to save, return a resolved promise
            if (!manager.hasChanges()) { return Q(); }

            var description = describeSaveOperation(masterEntity);
            return manager.saveChanges().then(saveSucceeded).fail(saveFailed);

            function saveSucceeded() {
                logger.log("saved " + description);
            }

            function saveFailed(error) {
                var msg = "Error saving " +
                    description + ": " +
                    getErrorMessage(error);

                masterEntity.errorMessage = msg;
                logger.log(msg, 'error');
                // Let user see invalid value briefly before reverting
                $timeout(function () { manager.rejectChanges(); }, 1000);
                throw error; // so caller can see failure
            }
        }
        function describeSaveOperation(entity) {
            var statename = entity.entityAspect.entityState.name.toLowerCase();
            var typeName = entity.entityType.shortName;
            var title = entity.title;
            title = title ? (" '" + title + "'") : "";
            return statename + " " + typeName + title;
        }
        function getErrorMessage(error) {
            var reason = error.message;
            if (reason.match(/validation error/i)) {
                reason = getValidationErrorMessage(error);
            }
            return reason;
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

        function configureBreeze() {
            // configure to use the model library for Angular
            breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true);

            // configure to use camelCase
            breeze.NamingConvention.camelCase.setAsDefault();

            // configure to resist CSRF attack
            var antiForgeryToken = $("#antiForgeryToken").val();
            if (antiForgeryToken) {
                // get the current default Breeze AJAX adapter & add header
                var ajaxAdapter = breeze.config.getAdapterInstance("ajax");
                ajaxAdapter.defaultSettings = {
                    headers: {
                        'RequestVerificationToken': antiForgeryToken
                    },
                };
            }
        }
        //#endregion
    }]);