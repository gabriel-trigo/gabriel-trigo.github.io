export function generateNodesLinks(layers) {
    
    var nodesLinks = layers.then((data) => {
    
        var allPromises = Promise.all(data.map((el) => el.weights))
        var nodesLinks = allPromises.then((weightsArr) => {
            var nodes = []
            var links = []
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].size; j++) {
                    nodes.push({id: "" + i + j, name: ""})
                    if (i > 0) {
                        for (var k=0; k < data[i - 1].size; k++) {
                            links.push({source: "" + (i - 1) + k, target: "" + i + j, 
                                weight: weightsArr[i][k][j]})
                        }
                    }
                }
            }
            return [nodes, links]
        })
        return nodesLinks
    })
    return nodesLinks
}



var data = {
    nodes: [
      { id: "Node 1" },
      { id: "Node 2" },
      { id: "Node 3" }, 
      { id: "Node 4" }, 
      { id: "Node 5" }
    ],
    links: [
      { source: "Node 1", target: "Node 2" },
      { source: "Node 2", target: "Node 3" }, 
      { source: "Node 2", target: "Node 5" }, 
      { source: "Node 2", target: "Node 4" }
    ]
};

export function myGraph(nodes, links) { 
    var svg = d3.select("#graph");
    var width = 300;
    var height = 300;

    var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

    simulation.alpha(0.1)
    simulation.alphaDecay(0)

    simulation.nodes(nodes);
    simulation.force("link").links(links);

    console.log(links)
    console.log(nodes)

    var link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "pink")
    .attr("stroke-width", (d) => d.weight);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
  .domain(nodes.map((d) => d.id.charAt(0)));

    var node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 10)
        .attr("fill", (d) => {
            if (d.id.charAt(0) == '0') {
                return "#f6fff8"
            }
            if (d.id.charAt(0) == '1') {
                return "#efc88b"
            }

            if (d.id.charAt(0) == '2') {
                return "#6b9080"
            }
            return "#ff90b3"
        });

    // Node labels.
    var nodeLabels = svg
      .append('g')
      .attr('class', 'node-labels')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', (d) => d.x + 10)
      .attr('y', (d) => d.y + 10)
      .attr('fill', () => "white")
      .style('font-family', 'Consolas, monospace') // Set the font-family to Consolas
      .text((d) => d.name);

    simulation.on("tick", function() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        nodeLabels
            .attr('x', (d) => d.x + 10)
            .attr('y', (d) => d.y + 10)
            .text((d) => d.name)

        if (node.id == "30") {
            console.log("hey")
        }
    });
    

    // Add a drag behavior.
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(d) {
        if (!event.active) simulation.alphaTarget(0.01).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    simulation.alpha(0.1).restart();
}