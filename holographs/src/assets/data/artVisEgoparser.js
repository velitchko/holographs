const fs = require('fs');
const path = require('path');

// Define a function to read and parse JSON files
function readJSONFile(filePath) {
    console.log(filePath);
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

// call constructGraphFromJSON function
constructGraphFromJSON();

// Define a function to construct nodes and edges from JSON data
function constructGraphFromJSON() {
    // Read the JSON file
    fs.readFile('artVisEgo277.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        try {
            // Parse the JSON data
            const parsedData = JSON.parse(data);

            const uniqueNodes = new Set();
            const edges = new Array();

            parsedData.forEach(edge => {
                const source = {
                    id: +edge.aID,
                    label: edge.aFirstname.substring(0,1) + '. ' + edge.aLastname,
                };

                const target = {
                    id: +edge.bID,
                    label: edge.bFirstname.substring(0,1) + '. ' + edge.bLastname,
                };

                const link = {
                    source: source.id,
                    target: target.id,
                    weight: 1,
                    year: edge.time,
                };
                
                uniqueNodes.add(source);
                uniqueNodes.add(target);

                // push edges to array as long as they are not already in the array (s-t and t-s)
                if (!edges.some(e => e.source === link.source && e.target === link.target)) {
                    edges.push(link);
                }
            });
            
            console.log('Nodes:', uniqueNodes);
            console.log('Edges:', edges);

            // structures the nodes and edges in a graph format that is an array for each year 
            // [
            //  {
            //      year: <year>,
            //      nodes: [nodes],
            //      links: [edges]
            // }
            // ]
            const graphData = new Array();
            const uniqueNodesArray = Array.from(uniqueNodes);
            const years = new Set(parsedData.map(edge => edge.time));
            years.forEach(year => {
                const nodes = uniqueNodesArray.map(node => {
                    return {
                        id: node.id,
                        label: node.label,
                    };
                });

                const links = edges.filter(edge => edge.year === year);

                graphData.push({
                    year: year,
                    nodes: nodes,
                    links: links,
                });
            });

            console.log(graphData);

            
            // Write graphData to a JSON file
            const outputFilePath = path.join(__dirname, 'avGraphData.json');
            fs.writeFile(outputFilePath, JSON.stringify(graphData, null, 2), err => {
                if (err) {
                    console.error('Error writing JSON file:', err);
                    return;
                }
                console.log('Graph data has been written to graphData.json');
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
}
