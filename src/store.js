import * as IDB from 'idb-keyval'
import * as Automerge from 'automerge-wasm-pack'
import { writable } from 'svelte/store';


const ROOT = '_root'

// as a first pass the automerge document is not exposed to consumer of the store
// rather, whenever the automerge document is updated, we then update the store
// manually....
// FIXME(ja): it should probably not work that way ?

export const createAutomergeStore = () => {
    const { subscribe, set, update } = writable([]);

    let doc = Automerge.create()

    const reset = () => {
        doc.set_object(ROOT, 'items', [])
    }

    const add = (item) => {
        let itemsRef = doc.value(ROOT, 'items')[1]
        doc.push_object(itemsRef, item)
        updateStore();
    }

    const remove = (index) => {
        let itemsRef = doc.value(ROOT, 'items')[1]
        doc.del(itemsRef, index)
        updateStore()
    }

    const updateStore = () => {
        let items = [];
        let itemsRef = doc.value(ROOT, 'items')[1]
        for (let i = 0; i < doc.length(itemsRef); i++) {
            let theItemRef = doc.value(itemsRef, i)[1]
            let obj = {}

            doc.keys(theItemRef).forEach((k) => {
                obj[k] = doc.value(theItemRef, k)[1]
            })
            items.push(obj)
        }
        set(items)
    }


    reset(); // initialize

    return {
        subscribe,
        add,
        reset,
        remove
    };
}


// let save = async (doc, fileHandle) => {
//     const writable = await fileHandle.createWritable()
//     await writable.write(doc.save())
//     await writable.close()
// }

// let load = async () => {
//     fileHandle = await IDB.get('file')
// }

// load()

// $: try {
//     if (fileHandle) {
//         save(doc, fileHandle)
//     }
// } catch (err) {
//     // noop
// }

// const options = {
//     mode: 'readwrite',
//     suggestedName: 'todo.mrg',
//     types: [
//         {
//             description: 'Automerge Files',
//             accept: {
//                 'application/octet-stream': ['.mrg'],
//             },
//         },
//     ],
// }

// async function newFileHandle() {
//     fileHandle = await window.showSaveFilePicker(options)
//     await IDB.set('file', fileHandle)

//     doc = Automerge.create()
//     doc.set_object(ROOT, 'items', [])
// }

// async function saveFileHandle() {
//     fileHandle = await window.showSaveFilePicker(options)
//     await IDB.set('file', fileHandle)
// }

// async function loadFileHandle(handle) {
//     if (!handle) {
//         ;[fileHandle] = await window.showOpenFilePicker(options)
//         await IDB.set('file', fileHandle)
//     } else {
//         if (
//             !(
//                 (await fileHandle.queryPermission(options)) === 'granted' ||
//                 (await fileHandle.requestPermission(options)) === 'granted'
//             )
//         ) {
//             return
//         }
//     }

//     const file = await fileHandle.getFile()
//     const contents = await file.arrayBuffer()

//     doc = Automerge.loadDoc(new Uint8Array(contents))
// }