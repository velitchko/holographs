const fs = require('fs');
const path = require('path');

// Define a function to read and parse JSON files
function readJSONFile(filePath) {
    console.log(filePath);
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

// Define a function to construct nodes and edges from JSON data
function constructGraphFromJSON(jsonData, year) {
    const nodes = [];
    const edges = [];

    // Extract ego artist
    const egoArtist = {
        id: jsonData.id,
        firstname: jsonData.firstname,
        lastname: jsonData.lastname,
        year: year
    };
    nodes.push(egoArtist);

    // Extract related artists and edges
    const relatedArtists = jsonData.artistsExhibitedWithConnection.edges;
    relatedArtists.forEach(edge => {
        const relatedArtist = {
            id: edge.node.id,
            firstname: edge.node.firstname,
            lastname: edge.node.lastname,
        };
        nodes.push(relatedArtist);
        const edgeData = {
            source: egoArtist.id,
            target: relatedArtist.id,
        };
        edges.push(edgeData);
    });

    return { year, nodes, edges };
}

// Define a function to process all JSON files in a directory
function processJSONFiles(directoryPath) {
    console.log(directoryPath);
    const files = fs.readdirSync(directoryPath);

    const graphData = [];

    files.forEach(file => {
        const year = parseInt(file.split('_')[1].split('.')[0]); // Extract year from filename
        const filePath = path.join(directoryPath, file);
        const jsonData = readJSONFile(filePath);
        const graph = constructGraphFromJSON(jsonData[0], year);
        graphData.push(graph);
    });

    return graphData;
}

// Example usage:
const directoryPath = path.join(__dirname, './vk/'); // Update this with the path to your JSON files directory
const graphData = processJSONFiles(directoryPath);

// Write graphData to a JSON file
const outputFilePath = path.join(__dirname, 'graphData.json');
fs.writeFile(outputFilePath, JSON.stringify(graphData, null, 2), err => {
    if (err) {
        console.error('Error writing JSON file:', err);
        return;
    }
    console.log('Graph data has been written to graphData.json');
});
