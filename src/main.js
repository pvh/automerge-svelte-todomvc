import TodoMVC from './TodoMVC.svelte';
import * as Automerge from "automerge-wasm-pack"
const ROOT = "_root"

console.log(ROOT)

let doc = Automerge.create()

console.log("created", doc)

doc.set(ROOT, 'id', id) 


window.todomvc = new TodoMVC({
	target: document.querySelector('.todoapp')
});
