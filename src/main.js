import TodoMVC from './TodoMVC.svelte';

import init from "automerge-wasm-pack"

init().then(() => {
	window.todomvc = new TodoMVC({
		target: document.querySelector('.todoapp')
	})
})

