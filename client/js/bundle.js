(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Queue = require('../../utils/queue');
let timeout = 1000;
const queue = new Queue();
let num = 0;
let p = 0;

const cy = cytoscape({
    container: document.getElementById('cy-div'),

    boxSelectionEnabled: false,
    autounselectify: true,
    animate: true,
    style: cytoscape.stylesheet()
        .selector('node')
        .selector('edge')
        .style({
            // 'curve-style': 'bezier',
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

    layout: { 
        name: 'cola',
        avoidOverlap: true 
    },
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
});

let options = {
    nodesMatching: function( node ){ return node._private.data.id.startsWith('n'); },
    reposition: node => {
        const pos = node.position();
        return {x: pos.x, y:0};
    },
    when: 'matching'
};
const rule = cy.automove( options );
rule.apply();
rule.disable();
const ur = cy.undoRedo();

const group = () => {
    cy.add({ group: "nodes", data: { id: `p${p}`}});
    let nodes = cy.elements('node[id *= "n"]');
    if (nodes.every((node) => node._private.data.parent)) {
        nodes = cy.elements('node[id *= "p"]');
    }
    
    nodes.forEach((node) => {
        if (!node._private.data.parent) {
            // console.log(node);
            node.move({parent: `p${p}`});
        }
    });
    p += 1;
};

const ungroup = () => {
    p -= 1;
    cy.nodes().forEach((node) => {
        if (node._private.data.parent == `p${p}`) {
            node.move({parent: null});
        }
    });
    cy.getElementById(`p${p}`).remove();
};

ur.action("group", group, ungroup); // register
ur.action("ungroup", ungroup, group); // register


function KeyPress(e) {
    if (e.keyCode == 89 && e.ctrlKey) ur.redo();
    if (e.keyCode == 90 && e.ctrlKey) ur.undo();
}

document.onkeydown = KeyPress




document.getElementById('btn-random').addEventListener("click", () => makeRandomGraph(false));
document.getElementById('btn-random2').addEventListener("click", () => makeRandomGraph(true));
document.getElementById('btn-remove').addEventListener("click", () => ur.do("remove", cy.elements('edge')));
// document.getElementById('btn-fit').addEventListener("click", fitGraph);
document.getElementById('btn-greedy').addEventListener("click", () => calculateGreedy(false));
document.getElementById('btn-mst').addEventListener("click", () => calculateGreedy(true));
document.getElementById("input-random").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    makeRandomGraph();
  }
});
document.getElementById("option1").addEventListener("change", () => {
    rule.toggle();
});
document.getElementById("option2").addEventListener("change", () => {
    rule.toggle();
});

document.getElementById("btn-polygon").addEventListener("click", function() {
    const numberOfNodes = document.getElementById("input-num-polygon").value;
    const path = document.getElementById("input-polygon").value;
    const data = {path, numberOfNodes};
    const url = "/polygon";
    const func = (res) => {
        const { positions } = res;
        const nodes = [];
        for (position of positions) {
            nodes.push({
                data: { id: `n${num}` },
                position
            });
            num += 1;
        }
        ur.do("add", nodes);
        fitGraph();
    };
    sendJSON(data, url, func);
});

document.getElementById("btn-load").addEventListener("click", function() {
    const path = document.getElementById("input-load").value;
    const data = { path };
    const url = "/load";
    const func = (res) =>  {
        const {positions} = res;
        const nodes = [];
        for (position of positions) {
            nodes.push({
                data: { id: `n${num}` },
                position
            });
            num += 1;
        }
        ur.do("add", nodes);
        fitGraph();
    };
    sendJSON(data, url, func);
});

document.getElementById("btn-save").addEventListener("click", function() {
    const path = document.getElementById("input-save").value;
    const positions = cy.nodes().map(elem => elem._private.position);
    const data = { positions, path };
    const url = "/save";
    sendJSON(data, url, function (res) {
        const {done} = res;
        if (done) {
            alert("saved graph");
        }
        else {
            alert("problem saving graph");
        }
    });
});

document.getElementById("btn-group").addEventListener("click", function() {
    ur.do("group", []);
});

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

const changeStyle = (value) => {
    cy.style()
     .fromJson([
       {
         selector: 'node',
         style: {
            'height': value,
            'width': value
         }
       },
       {
            selector: 'edge',
            style: {
            'width': 4 * value / 30
            }
       }
     ]).update();
};

const rangeSize = document.getElementById('input-range-size');
const fieldSize = document.getElementById('input-size');

rangeSize.addEventListener('input', function (e) {
     fieldSize.value = e.target.value; 
     changeStyle(e.target.value);
     //  cy.nodes().forEach((node) => {
    //         node.style({
    //             'width': e.target.value,
    //             'height': e.target.value
    //         });
    //     }
    // );
    // cy.elements('edge').forEach((edge) => {
    //     edge.style({
    //         width: 4 * e.target.value / 30
    //     });
    // });
});
fieldSize.addEventListener('input', function (e) {
     rangeSize.value = e.target.value; 
     changeStyle(e.target.value);
     //  cy.nodes().forEach((node) => {
    //         node.style({
    //             'width': e.target.value,
    //             'height': e.target.value
    //         });
    //     }
    //  );
    //  cy.elements('edge').forEach((edge) => {
    //      edge.style({
    //          width: 4 * e.target.value / 30
    //      });
    //  });
});


// function generateRandomGraph(numberOfNodes) {
//     nodes = [];
//     for (let i = 0; i < numberOfNodes; i++) {
//         nodes.push(generateRandomNode(i));
//     }
//     return nodes
// }

// function generateRandomNode(index) {
//     return {group: "nodes", data: { id: `${index}` } }; // , position: generateRandomPosition()
// }

// function generateRandomPosition() {
//     const x = Math.random() * 900 + 100;
//     const y = Math.random() * 400 + 100;
    
//     return {x, y};
// }

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

function makeRandomGraph(append) {
    numberOfNodes = document.getElementById('input-random').value;
    if (!append) {
        p = 0;
        num = 0;
        ur.do("remove", cy.elements());
    }
    num += numberOfNodes;
    if (numberOfNodes > 0 && numberOfNodes < 1000) {
        const data = {numberOfNodes, append, num}
        const url = "/random"
        const func = (elements) =>  {
            const {nodes} = elements;
            // cy.add(nodes); 
            ur.do("add", nodes);
            fitGraph();
        };
        sendJSON(data, url, func)

        // num = numberOfNodes;
        // nodes = generateRandomGraph(num);
        // ur.do("add", nodes);

        // const layout = cy.elements().layout({
        //     name: 'random'
        //   });
          
        // layout.run();
    }
}

function fitGraph() {
    cy.maxZoom(1);
    cy.fit();
    cy.maxZoom(100);
    cy.zoom(cy.zoom() - 0.2);
}

function addEdge() {
    edge = queue.dequeue();
    ur.do("add", [edge]);
    if (!queue.isEmpty()) {
        setTimeout(addEdge, timeout);
    }
}


function addEdges(edges) {
    animate = document.getElementById("customSwitch").checked ;
    if (animate == true) {
        queue.enqueue(edges);
        addEdge();
    } else {
        ur.do("add", edges);
    }
}

function calculateGreedy(returnMST) {
    ur.do("remove", cy.elements('edge'));

    const angle = document.getElementById('input-range-angle').value;
    const nodes = cy.elements('node[id*="n"]').map(elem => {
        const privateElem = elem._private;
        return {
            id: privateElem.data.id,
            position: privateElem.position
        };
    });
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
            func(JSON.parse(xhr.responseText));
        }
    }
}

// cy.on('free', 'node', (e) => {
//     let item = e.target;
//     if (item.isNode()) {
//         console.log(item._private.position);
//     }
// })


cy.on('tap', function (e) {
    console.log(e.position);
    if (e.target === cy) {            
        // const offset = $("cy").offset();
        const position = {
            x: e.position.x,
            y: e.position.y
        };
        ur.do("add", [{
            group: "nodes",
            data: {
                id: `n${num}`
            },
            position
        }]);    
        
        num += 1
    } 
    else { 
        const targetId = e.target._private.data.id;
        if (targetId.startsWith('p')) {
            cy.nodes().forEach((node) => {
                if (node._private.data.parent == targetId) {
                    // console.log(node);
                    node.move({parent: null});
                }
            });
            cy.remove(e.target);
        } else {
            ur.do("remove", e.target);
        }
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




},{"../../utils/queue":2}],2:[function(require,module,exports){
module.exports = class Queue {
    constructor() {
      this.elements = [];
    }
    enqueue(elements)
    {
      this.elements = [...elements];
    }
    dequeue()
    {
      if(this.isEmpty())
        return "Underflow";
      return this.elements.shift();
    }
    peek() {
      if(this.isEmpty())
        return "No elements in Queue";
      return this.elements[0];    
    }
    isEmpty() {
      return this.elements.length == 0;
    }
  }
},{}]},{},[1]);
