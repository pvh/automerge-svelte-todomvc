<script>
	import * as IDB from 'idb-keyval';
	import * as Automerge from 'automerge-wasm-pack'
	let ROOT = "_root"

	const ENTER_KEY = 13;
	const ESCAPE_KEY = 27;

	let doc = Automerge.create()
	doc.set_object(ROOT, "items", [])
	doc = doc

	let fileHandle
	
	let items;
	let currentFilter = 'all';
	let editing = null;

	const updateView = () => {
		currentFilter = 'all';
		if (window.location.hash === '#/active') {
			currentFilter = 'active';
		} else if (window.location.hash === '#/completed') {
			currentFilter = 'completed';
		}
	};

	window.addEventListener('hashchange', updateView);
	updateView();

	let itemsRef
	$: itemsRef = doc.value(ROOT, "items")[1]

	function clearCompleted() {
		items = items.filter(item => !item.completed);
	}

	function remove(index) {
		doc.del(itemsRef, index)
		doc = doc
	}

	function toggleAll(event) {
		items = items.map(item => ({
			id: item.id,
			description: item.description,
			completed: event.target.checked
		}));
	}

	function createNew(event) {
		if (event.which === ENTER_KEY) {
			let itemsRef = doc.value(ROOT, "items")[1]
			doc.push_object(itemsRef, {
				id: uuid(),
				description: event.target.value,
				completed: false
			});
			doc = doc
			event.target.value = '';
		}
	}

	function handleEdit(event) {
		if (event.which === ENTER_KEY) event.target.blur();
		else if (event.which === ESCAPE_KEY) editing = null;
	}

	function submit(event) {
		let itemsRef = doc.value(ROOT, "items")[1]
		let theItem = doc.value(itemsRef, editing)[1]
		doc.set(theItem, "description", event.target.value)
		doc = doc
		editing = null;
	}

	function uuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	$: {
		items = [];
		let itemsRef = doc.value(ROOT, "items")[1]
		for (let i = 0; i < doc.length(itemsRef); i++) { 
			let theItemRef = doc.value(itemsRef, i)[1]
			let obj = {}

			doc.keys(theItemRef).forEach((k) => { 
				obj[k] = doc.value(theItemRef, k)[1]
			 })
			items.push(obj)
		}
	}

	

	$: filtered = currentFilter === 'all'
		? items
		: currentFilter === 'completed'
			? items.filter(item => item.completed)
			: items.filter(item => !item.completed);

	$: numActive = items.filter(item => !item.completed).length;

	$: numCompleted = items.filter(item => item.completed).length;

	let save = async (doc, fileHandle) => {	
		const writable = await fileHandle.createWritable();
		await writable.write(doc.save());
		await writable.close();
	}

	let load = async() => {
		fileHandle = await IDB.get("file")
	}
	
	load();

	$: try {
		if (fileHandle) { save(doc, fileHandle) }
	} catch (err) {
		// noop
	}

	const options = {
		mode: 'readwrite',
		suggestedName: 'todo.mrg',
		types: [
			{
				description: 'Automerge Files',
				accept: {
				'application/octet-stream': ['.mrg'],
				},
			},
		],
	};
	
	async function newFileHandle() {
		fileHandle = await window.showSaveFilePicker(options);
		await IDB.set('file', fileHandle);
		
		doc = Automerge.create()
		doc.set_object(ROOT, "items", [])
	}

	async function saveFileHandle() {
		fileHandle = await window.showSaveFilePicker(options);
		await IDB.set('file', fileHandle);
	}
	
	async function loadFileHandle(handle) {
		if (!handle) {
			[fileHandle] = await window.showOpenFilePicker(options);
			await IDB.set('file', fileHandle);
		}
		else {
		    if (!(await fileHandle.queryPermission(options) === 'granted' || 
				  await fileHandle.requestPermission(options) === 'granted')) {
					  return
			}
		}
		
		const file = await fileHandle.getFile();
		const contents = await file.arrayBuffer();
		
		doc = Automerge.loadDoc(new Uint8Array(contents))
	}
</script>

<header class="header">
	<div>
		<button on:click="{() => newFileHandle()}">New...</button>
		{#if fileHandle}<button on:click="{() => loadFileHandle(fileHandle)}">{fileHandle.name}</button>{/if}
		<button on:click="{() => loadFileHandle()}">Open...</button>
		<button on:click="{() => saveFileHandle()}">Save As...</button>
	</div>

	<h1>todo</h1>
	<input
		class="new-todo"
		on:keydown={createNew}
		placeholder="What needs to be done?"
		autofocus
	>
</header>

{#if items.length > 0}
	<section class="main">
		<input id="toggle-all" class="toggle-all" type="checkbox" on:change={toggleAll} checked="{numCompleted === items.length}">
		<label for="toggle-all">Mark all as complete</label>

		<ul class="todo-list">
			{#each filtered as item, index (item.id)}
				<li class="{item.completed ? 'completed' : ''} {editing === index ? 'editing' : ''}">
					<div class="view">
						<input class="toggle" type="checkbox" bind:checked={item.completed}>
						<label on:dblclick="{() => editing = index}">{item.description}</label>
						<button on:click="{() => remove(index)}" class="destroy"></button>
					</div>

					{#if editing === index}
						<input
							value='{item.description}'
							id="edit"
							class="edit"
							on:keydown={handleEdit}
							on:blur={submit}
							autofocus
						>
					{/if}
				</li>
			{/each}
		</ul>

		<footer class="footer">
			<span class="todo-count">
				<strong>{numActive}</strong> {numActive === 1 ? 'item' : 'items'} left
			</span>

			<ul class="filters">
				<li><a class="{currentFilter === 'all' ? 'selected' : ''}" href="#/">All</a></li>
				<li><a class="{currentFilter === 'active' ? 'selected' : ''}" href="#/active">Active</a></li>
				<li><a class="{currentFilter === 'completed' ? 'selected' : ''}" href="#/completed">Completed</a></li>
			</ul>

			{#if numCompleted}
				<button class="clear-completed" on:click={clearCompleted}>
					Clear completed
				</button>
			{/if}
		</footer>
	</section>
{/if}