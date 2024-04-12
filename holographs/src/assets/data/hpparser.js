const fs = require('fs');
const csv =  require('csv-parser');
const path = require('path');


async function loadCSV(filename) {
    const data = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filename)
            .pipe(csv())
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', reject);
    });
}

async function loadGraphData() {
    // Load characters
    // const characters = await loadCSV('./hp/characters.csv');
    // // assign ID to each character
    // characters.forEach((d, i) => d.id = i);

    // const nodes = characters.map(d => ({ id: d.id, name: d.character}));
    // console.log(nodes);
    // Load books
    const numBooks = 7; // replace with the number of books
    const graphs = [];
    // keep track of assigned ids
    const idMap = new Map();

    for (let i = 1; i <= numBooks; i++) {
        // extract nodes from the book
        console.log(`Loading book ${i}`);
        const edgesData = await loadCSV(`./hp/book${i}.csv`);
        // set up nodes per book
        const characters = [];
        edgesData.forEach(d => {
            if (!characters.find(c => c.character === d.source)) {
                characters.push({character: d.source});
            }
            if (!characters.find(c => c.character === d.target)) {
                characters.push({character: d.target});
            }
        });
        
        // assign ID to each character if not already assigned
        characters.forEach((d, i) => {
            if (!idMap.has(d.character)) {
                idMap.set(d.character, idMap.size);
            }
            d.id = idMap.get(d.character);
        });

        const nodes = characters.map(d => ({id: d.id, name: d.character}));

        // get character id for each source and target
        edgesData.forEach(d => {
            d.source = characters.find(c => c.character === d.source).id;
            d.target = characters.find(c => c.character === d.target).id;
        });
        const edges = edgesData.map(d => ({source: d.source, target: d.target, weight: +d.weight, year: i}));
        graphs.push({year: i, nodes, edges});
    }
    return graphs;
}

loadGraphData().then(graphs => {
    const outputFilePath = path.join(__dirname, 'hpgraphData.json');
    fs.writeFile(outputFilePath, JSON.stringify(graphs, null, 2), err => {
        if (err) {
            console.error('Error writing JSON file:', err);
            return;
        }
        console.log('Graph data has been written to graphData.json');
    });
});