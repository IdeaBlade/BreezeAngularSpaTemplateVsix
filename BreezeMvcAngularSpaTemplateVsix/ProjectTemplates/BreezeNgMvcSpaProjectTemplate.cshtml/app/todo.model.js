/* model: extend server-supplied metadata with client-side entity model members */
todo.factory('model', function () {

    var datacontext;
    
    extendTodoList();
    
    var model = {
        initialize: initialize
    };
    
    return model;
  
    //#region private members
    function initialize(context) {
        datacontext = context;
        var store = datacontext.metadataStore;
        store.registerEntityTypeCtor("TodoItem", null, todoItemInitializer);
        store.registerEntityTypeCtor("TodoList", TodoList, todoListInitializer);
    }
    
    function todoItemInitializer(todoItem) {
        todoItem.errorMessage = "";
    }

    function todoListInitializer(todoList) {
        todoList.errorMessage = "";
        todoList.newTodoTitle = "";
        todoList.isEditingListTitle = false;
    }

    function TodoList() {
        this.title = "My todos"; // defaults
        this.userId = "to be replaced";
    }
    
    function extendTodoList() {
        TodoList.prototype.addTodo = function () {
            var todoList = this;
            var title = todoList.newTodoTitle;
            if (title) { // need a title to save
                var todoItem = datacontext.createTodoItem();
                todoItem.title = title;
                todoItem.todoList = todoList;
                datacontext.saveEntity(todoItem);
                todoList.newTodoTitle = ""; // clear UI title box
            }
        };

        TodoList.prototype.deleteTodo = function (todo) {
            return datacontext.deleteTodoItem(todo);
        };
    }
    //#endregion
});