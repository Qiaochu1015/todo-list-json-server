//Fetch Implementation
//GET
const myFetch = (url, options = {}) => {
	const { method = "GET", headers = {}, body } = options;

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open(method, url);

		Object.keys(headers).forEach((key) => {
			xhr.setRequestHeader(key, headers[key]);
		});

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(xhr.responseText);
			} else {
				reject(new Error(xhr.statusText));
			}
		};

		xhr.onerror = () => {
			reject(new Error("Network Error"));
		};

		xhr.send(body);
	});
};

//POST

//APIs
const APIs = (() => {
	const url = "http://localhost:3000/todos";

	//Create todo items
	const createTodo = (newTodo) => {
		return myFetch(url, {
			method: "POST",
			body: JSON.stringify(newTodo),
			headers: { "Content-Type": "application/json" },
		}).then((res) => res.json());
	};

	//Delete todo items
	const deleteTodo = (id) => {
		return fetch(`${url}/${id}`, {
			method: "DELETE",
		}).then((res) => res.json());
	};

	//Read data to initialize
	const getTodos = () => {
		return fetch(url).then((res) => res.json());
	};

	//Edit data
	const editTodo = (id, data) => {
		return myFetch(`${url}/${data.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}).then((res) => res.json());
	};

	return { createTodo, deleteTodo, getTodos, editTodo };
})();

//-- Model --
//manage data
const Model = (() => {
	class State {
		#todos; //data array
		// #completed;
		#onChange; //function, will be called when setter function is called
		//used to render DOM on change in data
		constructor() {
			this.#todos = [];
		}
		get todos() {
			//Read todo data
			return this.#todos;
		}
		set todos(newTodos) {
			//Write todo data
			this.#todos = newTodos;
			this.#onChange?.();
			//shorter syntax for & operator, call if its not undefined
			//this.#onChange !== undefined && this.#onChange
			//if we update the state, we want to update the DOM
		}

		// get completed() {
		// 	return this.#completed;
		// }

		// set completed(newCompleted) {
		// 	this.#completed = newCompleted;
		// 	this.#onChange?.();
		// }

		subscribe(callback) {
			//subscribe to the change of the state
			this.#onChange = callback; //let the controller decide what to function it is
		}
	}

	//the methods fetching data from API can also be part of model
	const { createTodo, deleteTodo, getTodos, editTodo, editTodo2 } = APIs;

	return {
		State,
		createTodo,
		deleteTodo,
		getTodos,
		editTodo,
		editTodo2,
	};
})();
/* 
    todos = [
        {
            id:1,
            isCompleted: false,
            content:"eat lunch"
        },
        {
            id:2,
            isCompleted: false,
            content:"eat breakfast"
        }
    ]
*/

//-- View --
//manage DOM
const View = (() => {
	const todolistEl = document.querySelector(".todo-list");
	const submitBtnEl = document.querySelector(".submit-btn");
	const inputEl = document.querySelector(".input");
	const completeSection = document.querySelector("#completed-tasks");

	//rendering todos based on the state todo data
	const renderTodos = (todos) => {
		console.log("todos", todos);
		let todoTemplate = "";
		let completeTemplate = "";

		todos.forEach((todo) => {
			const temp1 = `<li><input type="text" name="${todo.id}" class="todo-input ${todo.id}" value="${todo.content}" readonly />
			<button class="edit-btn ${todo.id}" >Edit</button>
			<button class="complete-btn ${todo.id}" >Complete</button>
			<button class="delete-btn ${todo.id}">Delete</button></li>`;

			// 	const temp2 = `<li><input type="text" name="${todo.id}" class="todo-input ${todo.id}" value="${todo.content}" readonly />
			// 	<button class="complete-btn ${todo.id}" >Complete</button>
			// 	<button class="delete-btn ${todo.id}">Delete</button></li>`
			// 	todoTemplate += liTemplate;

			// 	todo.isCompleted ? completeTemplate += temp2 : todoTemplate += temp1
			// });
			todoTemplate += temp1;
		});

		if (todos.length === 0) {
			todoTemplate = "<h4>No on-going task to display</h4>";
		}

		todolistEl.innerHTML = todoTemplate;
		// completeSection.innerHTML = incompleteTemplate;
	};

	const clearInput = () => {
		inputEl.value = "";
	};

	const focusInput = () => {
		inputEl.focus();
	};

	const makeEditable = (id) => {
		const input = document.querySelector(`input[name="${id}"]`);
		const button = document.querySelector(`button[class="edit-btn ${id}"]`);
		input.removeAttribute("readonly");
		input.classList.add("editing");
		input.focus();
		button.innerText = "Save";
	};

	const saveEdit = (id) => {
		const input = document.querySelector(`input[name="${id}"]`);
		const button = document.querySelector(`button[class="edit-btn ${id}"]`);
		input.setAttribute("readonly", "readonly");
		input.classList.remove("editing");
		button.innerText = "Edit";

		return input.value;
	};

	const completeTask = (id) => {
		const input = document.querySelector(`input[name="${id}"]`);
		const button = document.querySelector(
			`button[class="complete-btn ${id}"]`
		);

		input.classList.add("completed");
		button.innerText = "Incomplete";
		console.log("completed");
	};

	const incompleteTask = (id) => {
		const input = document.querySelector(`input[name="${id}"]`);
		const button = document.querySelector(
			`button[class="complete-btn ${id}"]`
		);

		input.classList.remove("completed");
		button.innerText = "Complete";
	};

	return {
		renderTodos,
		todolistEl,
		submitBtnEl,
		inputEl,
		clearInput,
		focusInput,
		makeEditable,
		saveEdit,
		completeTask,
		incompleteTask,
	};
})();

//-- Controller --
//interaction between view and model, logics, handle events
const Controller = ((view, model) => {
	const state = new model.State();

	//initiallization fetch data from db to state
	const init = () => {
		//read the todos data from db using getTodos in Model
		model.getTodos().then((todos) => {
			todos.reverse(); //decending order so the newly added task in on top
			state.todos = todos; //setter function to set data to state
		});
	};

	const handleSubmit = () => {
		view.submitBtnEl.addEventListener("click", (e) => {
			//read input value -> post request update db -> render DOM
			//(just update state, the state will #onchange -> subscribe -> renderTodos)
			const inputValue = view.inputEl.value;
			model
				.createTodo({
					content: inputValue,
					isCompleted: false,
				})
				.then((data) => {
					//to call setter, you cannot mutate the state array
					state.todos = [data, ...state.todos];
					view.clearInput(); //only clear input after previous request succeeded
					view.focusInput();
				});
		});
	};

	const handleDelete = () => {
		view.todolistEl.addEventListener("click", (e) => {
			if (e.target.classList.contains("delete-btn")) {
				const id = e.target.classList[1];
				model.deleteTodo(+id).then((data) => {
					state.todos = state.todos.filter((todo) => todo.id !== +id);
				});
			}
		});
	};

	const handleEdit = () => {
		view.todolistEl.addEventListener("click", (e) => {
			if (e.target.classList.contains("edit-btn")) {
				const id = e.target.classList[1];
				// console.log("edit-id", id)

				const tempData = [...state.todos].filter((el) => el.id === +id);
				// console.log(tempData[0].isCompleted)

				if (e.target.innerText === "Edit") {
					view.makeEditable(id);
				} else {
					const newValue = view.saveEdit(id);
					model
						.editTodo(+id, {
							content: newValue,
							isCompleted: tempData[0].isCompleted,
							id: id,
						})
						.then((data) => {
							state.todos = state.todos.map((todo) => {
								if (todo.id === +id) {
									return data;
								} else {
									return todo;
								}
							});
						});
					view.saveEdit(id);
					// console.log(state.todos);
				}
			}
		});
	};

	const handleComplete = () => {
		view.todolistEl.addEventListener("click", (e) => {
			if (e.target.classList.contains("complete-btn")) {
				const id = e.target.classList[1];
				console.log("complete-id", id);

				const tempData = [...state.todos].filter((el) => el.id === +id);
				console.log("tempdata", tempData);

				let newValue;

				if (e.target.innerText === "Complete") {
					newValue = true;
					view.completeTask(id);
				} else {
					newValue = false;
					view.incompleteTask(id);
				}

				model
					.editTodo(+id, {
						content: tempData[0].content,
						isCompleted: newValue,
						id: id,
					})
					.then((data) => {
						console.log("data", data);
						state.todos = state.todos.map((todo) => {
							if (todo.id === +id) {
								return {
									content: data.content,
									isCompleted: data.isCompleted,
									id: data.id,
								};
							} else {
								return todo;
							}
						});
						console.log("state", state.todos);
					});
			}
		});
	};

	const bootstrap = () => {
		init();
		handleSubmit();
		handleDelete();
		handleEdit();
		handleComplete();
		state.subscribe(() => {
			view.renderTodos(state.todos); //use renderTodos function from view
		}); //and data from Model state.todos(getter)
	};

	return { bootstrap };
})(View, Model);

Controller.bootstrap();
