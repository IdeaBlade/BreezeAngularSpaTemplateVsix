/* model: extend server-supplied metadata with client-side entity model members */
todo.factory('model', function () {

    var datacontext;

    var todoItemInitializer = function (todoItem) {
        todoItem.errorMessage = "";
    };

    var todoListInitializer = function (todoList) {
        todoList.errorMessage = "";
        todoList.newTodoTitle = "";
        todoList.isEditingListTitle = false;
    };

    var TodoList = function () {
        this.title = "My todos"; // defaults
        this.userId = "to be replaced";
    };

    TodoList.prototype.addTodo = function () {
        var todoList = this;
        var title = todoList.newTodoTitle;
        if (title) { // need a title to save
            todoList.newTodoTitle = "";
            var todoItem = datacontext.createTodoItem();
            todoItem.title = title;
            todoItem.todoList = todoList;
            datacontext.saveEntity(todoItem);
        }
    };

    TodoList.prototype.deleteTodo = function (todo) {
        return datacontext.deleteTodoItem(todo);
    };

    var initializeModel = function (context) {
        datacontext = context;
        var store = datacontext.metadataStore;
        store.registerEntityTypeCtor("TodoItem", null, todoItemInitializer);
        store.registerEntityTypeCtor("TodoList", TodoList, todoListInitializer);
    };

    return {
        initializeModel: initializeModel
    };

});