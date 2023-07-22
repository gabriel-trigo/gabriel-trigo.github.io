import {HEATMAP_DIM, HEATMAP_MARGIN, PIPE_GAP} from "https://gabriel-trigo.github.io/graph.js/constants.js"

export function load_models() {
    const model_promises = []
    let model = null;
    for (var i = 0; i < 10; i += 2) {
        model = tf.loadLayersModel(
            `https://gabriel-trigo.github.io/js_models/model_${i}/model.json`);
            model_promises.push(model);
    }
    console.log(model)
    return model_promises
}

export function predict(model, states) {
    const inputs = tf.tensor2d(states, [states.length, 4]);
    const result = model.then((data) => data.predict(inputs));
    return result
}

export function plot_heatmap() {

    // Define dimensions
    var margin = {
        top: HEATMAP_MARGIN, 
        right: HEATMAP_MARGIN, 
        bottom: HEATMAP_MARGIN, 
        left: HEATMAP_MARGIN
    };
    var width = HEATMAP_DIM - margin.left - margin.right;
    var height = HEATMAP_DIM - margin.top - margin.bottom;
    
    // Create tick values
    const numbers = []
    for (let i = 500; i >= 0; i -= 25) {
        numbers.push(i + "");
    }

    // Create the SVG element
    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top);

    // Build X scales and axis:
    var x = d3.scaleBand()
        .range([0, width])
        .domain(numbers)
        .padding(0.01);

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + height + ")")
        .call(d3.axisBottom(x).tickValues(["250"]))
        .style("outline", "#CDD5E0")
        .selectAll("text")
        .style("text-anchor", "end")
        .style("font-family", "Consolas, monospace")
        .style("stroke", "#CDD5E0")
        .attr("transform", "rotate(-90)")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");

    // Build X scales and axis:
    var y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(numbers)
        .padding(0.01);
    svg.append("g")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y).tickValues(["250"]))
        .selectAll("text", "path", "line")
        .style("fill-color", "#ffffff")
        .style("font-family", "Consolas, monospace")
        .style("stroke", "#CDD5E0");
    svg.selectAll(".domain").attr("stroke", "#ffffff");
    svg.selectAll(".tick line").attr("opacity", 1).attr("stroke", "#ffffff");
    
    return [svg, x, y];
}

export function update_data(model_promises, pipe_y, pipe_x, svg, axisx, axisy) {

    // Empty variables to be populated
    const states = [];
    const positions = [];
    const hm_data = [];

    // Create states to be evaluated
    for (let y = 500; y > -1; y -= 25) {
        for (let x = pipe_x; x > pipe_x - 501; x -= 25) {
            states.push([y - PIPE_GAP - pipe_y, 0, x, y - PIPE_GAP + pipe_y]);
            positions.push([x - pipe_x + 500, y])
        }
    }
    var result = predict(model_promises[4], states) // Evalute

    // Build color scale
    var myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno);


        
    result.then((data) => {

        // Select max utility
        const values = data.arraySync()
        for (let i = 1; i < states.length; i++) {
            hm_data.push({
                x: positions[i][0],
                y: positions[i][1],
                val: Math.max(...values[i])})
        }
        var rects = svg.selectAll("rect");
        rects.remove()

        // Insert the data
        svg.selectAll()
            .data(hm_data)
            .enter()
            .append("rect")
            .attr("x", function(d) {return axisx(d.x)})
            .attr("y", function(d) {return axisy(d.y)})
            .attr("width", axisx.bandwidth() )
            .attr("height", axisy.bandwidth() )
            .style("fill", function(d) {return myColor(d.val)} )
            .attr("transform", "translate(" + (HEATMAP_MARGIN + 1) + ", 0)")
        })
}