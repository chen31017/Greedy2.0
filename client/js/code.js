const Queue = require('../../utils/queue');
let timeout = 1000

const cy = cytoscape({
    container: document.getElementById('cy-div'),

    boxSelectionEnabled: false,
    autounselectify: true,
    animate: true,

    style: cytoscape.stylesheet()
        .selector('node')
        .selector('edge')
        .style({
            'curve-style': 'bezier',
            'width': 4,
            'line-color': '#ddd',
            'target-arrow-color': '#ddd'
        })
        .selector('.highlighted')
        .style({
            'background-color': '#61bffc',
            'line-color': '#61bffc',
            'target-arrow-color': '#61bffc',
            'transition-property': 'background-color, line-color, target-arrow-color',
            'transition-duration': '0.5s'
        }),
    elements: {nodes: [], edges: []},
    // elements: {
    //     nodes: [
    //         { data: { id: 'a' } },
    //     ],
    //
    //     edges: [
    //         { data: { id: 'a"e', weight: 1, source: 'a', target: 'e' } },
    //     ]
    // },

    layout: {
        name: 'breadthfirst',
        directed: true,
        roots: '#a',
        padding: 10
    }
});

const queue = new Queue();
let num = 0;

document.getElementById('btn-remove').addEventListener("click", () => cy.remove(cy.elements('edge')));
document.getElementById('btn-greedy').addEventListener("click", () => calculateGreedy(false));
document.getElementById('btn-mst').addEventListener("click", () => calculateGreedy(true));
const btnRandom = document.getElementById('btn-random');
btnRandom.addEventListener("click",  makeRandomGraph);

document.getElementById("input-random").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    btnRandom.click();
  }
});

// let random_btn = document.getElementById('btn-random');

function generateRandomGraph(numberOfNodes) {
    nodes = [];
    for (let i = 0; i < numberOfNodes; i++) {
        nodes.push(generateRandomNode(i));
    }
    return nodes
}

function generateRandomNode(index) {
    return {group: "nodes", data: { id: `${index}` } }; // , position: generateRandomPosition()
}

function generateRandomPosition() {
    const x = Math.random() * 900 + 100;
    const y = Math.random() * 400 + 100;
    
    return {x, y};
}

// function addNode() {
//     // const data = {}
//     // const url = "/add_node"
//     // const func = (node) => {
//     //     console.log(node)
//     //     cy.add([node]);
//     // };

//     // sendJSON(data, url, func)
//     node = generateRandomNode(num);
//     cy.add([node]);
//     num += 1;
// }

function makeRandomGraph() {
    numberOfNodes = document.getElementById('input-random').value;
    console.log(numberOfNodes);
    cy.elements().remove();
    num = 0;
    if (numberOfNodes > 0 && numberOfNodes < 1000) {
        // const data = {numberOfNodes}
        // const url = "/random"
        // const func = (elements) =>  {
        //     const {nodes} = elements;
        //     console.log(nodes)
        //     cy.add(nodes); 
        // };
        // sendJSON(data, url, func)

        num = numberOfNodes;
        nodes = generateRandomGraph(num);
        console.log(nodes);
        cy.add(nodes);

        const layout = cy.elements().layout({
            name: 'random'
          });
          
        layout.run();
        fitGraph();
    }
}

function addEdge() {
    edge = queue.dequeue();
    cy.add([edge]);
    if (!queue.isEmpty()) {
        setTimeout(addEdge, timeout);
    }
}


function addEdges(edges) {
    animate = document.getElementById("customSwitch").checked ;
    console.log(animate);
    if (animate == true) {
        queue.enqueue(edges);
        addEdge();
    } else {
        cy.add(edges);
    }
}

function calculateGreedy(returnMST) {
    cy.remove(cy.elements('edge'));

    const angle = document.getElementById('input-range-angle').value;
    const nodes = cy.nodes().map(elem => {
        p = elem._private;
        return {
            id: p.data.id,
            position: p.position
        };
    });
    console.log(nodes);
    const data = {nodes, angle};
    const url = "/greedy";
    const func = (res) =>  {
        const {elements} = res;
        const {greedy, mst, weights} = elements;
        const output = document.getElementById("output");
        output.innerText = `GREEDY: ${weights.greedy}, MST: ${weights.mst}, APPROXIMATION: ${weights.greedy / weights.mst}`

        const edges = returnMST ? mst : greedy;

        addEdges(edges); 
    };

    sendJSON(data, url, func);
}

function sendJSON(data, url, func) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader(
        "Content-Type", "application/json"
    );
    xhr.send(JSON.stringify(data));
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 &&
            xhr.status === 200) {
            console.log('hey')
            console.log(xhr.responseText);
            func(JSON.parse(xhr.responseText));
        }
    }
}

cy.on('free', 'node', (e) => {
    let item = e.target;
    if (item.isNode()) {
        console.log(item._private.position)
    }
})


cy.on('tap', function (e) {
    console.log(e)
    if (e.target === cy) {            
        // const offset = $("cy").offset();
        // console.log(offset);
        const position = {
            x: e.position.x,
            y: e.position.y
        };
        
        console.log(position);
        cy.add([{
            group: "nodes",
            data: {
                id: num.toString()
            },
            position
        }]);    
        
        num += 1
    } 
    else {
        e.target.remove()
    }
});



// var bfs = cy.elements().bfs('#a', function(){}, true);

// var i = 0;
// var highlightNextEle = function(){
//     if( i < bfs.path.length ){
//         bfs.path[i].addClass('highlighted');

//         i++;
//         setTimeout(highlightNextEle, 1000);
//     }
// };

// // kick off first highlight
// highlightNextEle();


const rangeAngle = document.getElementById('input-range-angle');
const fieldAngle = document.getElementById('input-angle');

rangeAngle.addEventListener('input', function (e) { fieldAngle.value = e.target.value; });
fieldAngle.addEventListener('input', function (e) { rangeAngle.value = e.target.value; });

const rangeSpeed = document.getElementById('input-range-speed');
const fieldSpeed = document.getElementById('input-speed');

rangeSpeed.addEventListener('input', function (e) { 
    fieldSpeed.value = e.target.value; 
    timeout = 1000 / e.target.value;
});
fieldSpeed.addEventListener('input', function (e) { 
    rangeSpeed.value = e.target.value; 
    timeout = 1000 / e.target.value;

});

// const rangeSize = document.getElementById('input-range-size');
// const fieldSize = document.getElementById('input-size');

// rangeSize.addEventListener('input', function (e) { 
//     fieldSize.value = e.target.value; 
//     setNodeSize(e.target.value);
// });
// fieldSize.addEventListener('input', function (e) { 
//     rangeSize.value = e.target.value; 
//     setNodeSize(e.target.value);
// });

// const setNodeSize = (size) => {
//     cy.nodes().forEach((node) => {
//         console.log(node.data());
//         node.data('width', size);
//         node.data('height', size); 
//     });

//     cy.resize();
// }

// const spcaeNodes = (x) => {
//     cy.nodes().layout({
//         name: 'preset',
//         animate: true,
//         fit: false,
//         transform: (node) => {
//           let position = {};
//           position.x = node.position('x') * x;
//           position.y = node.position('y') * x;
//           return position;
//         }
//       }).run();

//     cy.fit();
// }

const fitGraph = () => {
    cy.maxZoom(1);
    cy.fit();
    cy.maxZoom(100);
    cy.zoom(cy.zoom() - 0.2);
}

document.getElementById('btn-fit').addEventListener("click", fitGraph);