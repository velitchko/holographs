import { Component, ElementRef, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';

type Node = {
    id: number;
    firstname?: string;
    lastname?: string;
    name?: string;
    centrality?: number;
    x?: number;
    y?: number;
    fixed?: boolean;
};

type Edge = {
    source: number;
    target: number;
    weight: number;
    year: number;
    id: string;
};

type GraphData = {
    year: number;
    nodes: Array<Node>;
    edges: Array<Edge>;
};

type SuperGraph = {
    nodes: Set<Node>;
    edges: Set<Edge>;
};

@Component({
    selector: 'app-graph',
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {
    private graphData: Array<GraphData> = new Array<GraphData>();
    private superGraph: SuperGraph = { nodes: new Set<Node>(), edges: new Set<Edge>() };
    private previousNodeMap: Map<number, Node> = new Map<number, Node>();
    private nodeMap: Map<number, Node> = new Map<number, Node>();

    private nodes: d3.Selection<SVGCircleElement, Node, any, unknown>;
    private edges: d3.Selection<SVGLineElement, Edge, any, unknown>;
    private labels: d3.Selection<SVGTextElement, Node, any, unknown>;
    private areaScale: d3.ScalePower<number, number> | undefined;
    private simulation: d3.Simulation<d3.SimulationNodeDatum, Edge> | undefined;

    protected currentYear: number = 0;
    protected minYear: number = 0;
    protected maxYear: number = 0;

    protected ego: {
        id: number;
        firstname: string;
        lastname: string;
    };

    constructor(private http: HttpClient) {
        this.ego = { id: 0, firstname: 'Harry', lastname: 'Potter' };


        this.nodes = d3.select('#graph-container').selectAll('circle.node');
        this.edges = d3.select('#graph-container').selectAll('line.edge');
        this.labels = d3.select('#graph-container').selectAll('text.label');
    }

    ngOnInit(): void {
        this.loadGraphData();
    }

    loadGraphData(): void {
        this.http.get('../assets/data/hpgraphData.json').subscribe(data => {
            this.graphData = data as Array<GraphData>;
            this.currentYear = this.graphData[0].year - 1;
            this.minYear = this.graphData[0].year - 1;
            this.maxYear = this.graphData[this.graphData.length - 1].year - 1;

            // parse node ids and edge ids and weights to integers
            this.graphData.forEach((d: GraphData) => {
                d.year = +d.year;
                d.nodes.forEach((n: Node) => {
                    n.id = +n.id;
                    this.nodeMap.set(n.id, n);
                });
                d.edges.forEach((e: Edge) => {
                    e.source = +e.source;
                    e.target = +e.target;
                    e.weight = +e.weight;
                    e.year = +e.year;
                    e.id = e.source + '-' + e.target;
                });
            });

            // calculate degree centrality for each year
            this.graphData.forEach((d: GraphData) => {
                d.nodes.forEach((n: Node) => {
                    const connections = d.edges.filter((e: Edge) => e.source === n.id || e.target === n.id).length;
                    n.centrality = connections;
                });
            });

            // create distribution of edge weights per year
            const edgeWeights = this.graphData.map((d: GraphData) => {
                return d.edges.map((e: Edge) => e.weight);
            });

            // flatten all edges from all years
            const allEdges = this.graphData.flatMap((d: GraphData) => d.edges).slice();
            // filter edges that are below the 90th percentile of edge weights
            const filteredEdges = allEdges.filter((e: any) => e.weight >= (d3.quantile(edgeWeights.flat(), 0.9) || 0));

            const filteredNodes = new Set(filteredEdges.flatMap((e: Edge) => [e.source, e.target]));

            // create a super graph
            this.superGraph.nodes = new Set(Array.from(filteredNodes).map((n: number) => this.nodeMap.get(n) as Node));
            this.superGraph.edges = new Set(filteredEdges);


            // from graph.nodes filter out ones that are not in superGraph.nodes
            this.graphData.forEach((d: GraphData) => {
                d.nodes = d.nodes.filter((n: Node) => {
                    // check if node exists in superGraph.nodes by id
                    return Array.from(this.superGraph.nodes).map((n: Node) => n.id).includes(n.id);
                });
            });

            // filter out edges that are not in superGraph.edges
            this.graphData.forEach((d: GraphData) => {
                d.edges = d.edges.filter((e: Edge) => {
                    // check if edge exists in superGraph.edges by source and target
                    return Array.from(this.superGraph.edges).map((e: Edge) => e.source + '-' + e.target).includes(e.source + '-' + e.target);
                });
            });
            this.layout();
        });
    }

    layout(): void {
        // get width and height of the container graph-container
        const width = document?.getElementById('graph-container')?.clientWidth || 800;
        const height = document?.getElementById('graph-container')?.clientHeight || 800;

        this.areaScale = d3.scaleSqrt().domain([0, 100]).range([0, 50]);

        // add zoom
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event: any) => {
                d3.selectAll('g').attr('transform', event.transform);
            });

        const svg = d3.select('#graph-container').append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(zoom.bind(this));

        const g = svg
            .append('g')
            .attr('id', 'graph')

        // draw the edges
        const edges = g.append('g')
            .attr('class', 'edges');

        this.edges = edges.selectAll('.edge')
            .data(this.graphData[0].edges)
            .enter()
            .append('line')
            .attr('class', 'edge')
            .style('stroke', 'white')
            .style('stroke-width', 2)
            .attr('id', (l: Edge) => l.source + '-' + l.target);

        const nodes = g.append('g')
            .attr('class', 'nodes');
        // draw the nodes
        this.nodes = nodes.selectAll('.node')
            .data(this.graphData[0].nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', (n: Node) => {
                return this.areaScale?.(n.centrality || 0) || 0;
            })
            .attr('id', (n: Node) => n.id)
            .attr('fill', 'black')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        // this.nodes.exit().remove();
        const labels = g.append('g')
            .attr('class', 'labels');

        // draw the labels
        this.labels = labels.selectAll('.label')
            .data(this.graphData[0].nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text((n: Node) => n.name ? n.name : n.firstname + ' ' + n.lastname)
            .attr('fill', 'white');

        this.simulation = d3.forceSimulation(Array.from(this.graphData[this.currentYear].nodes) as d3.SimulationNodeDatum[])
            .force('link', d3.forceLink(Array.from(this.graphData[this.currentYear].edges)).id((d: any) => d.id).distance(400).strength(1))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
            .force('collide', d3.forceCollide().radius((d: any) => this.areaScale?.(d.centrality || 0) || 0));

        this.simulation.on('tick', this.ticked.bind(this));
    }

    private update(year: number) {
        const nodes = this.nodes.data(Array.from(this.graphData[year].nodes))
        this.nodes.exit().remove();
        this.nodes.enter()
            .append('circle')
            .attr('class', 'node')
            .attr('id', (n: Node) => n.id)
            .attr('r', (n: Node) => {
                return this.areaScale?.(n.centrality || 0) || 0;
            })
            .merge(nodes);

        const edges = this.edges.data(Array.from(this.graphData[year].edges));
        this.edges.exit().remove();
        this.edges.enter()
            .append('line')
            .attr('class', 'edge')
            .style('stroke', 'white')
            .style('stroke-width', 2)
            .attr('id', (l: Edge) => l.source + '-' + l.target)
            .merge(edges);

        const labels = this.labels.data(Array.from(this.graphData[year].nodes));
        this.labels.exit().remove();
        this.labels.enter().append('text').attr('class', 'label').merge(labels);

        this.simulation?.nodes(Array.from(this.graphData[year].nodes) as d3.SimulationNodeDatum[]);
        (this.simulation?.force('link') as any).links(Array.from(this.graphData[year].edges));

        this.simulation?.alpha(0.1).restart();
    }

    private ticked(): void {
        this.nodes
            .attr('cx', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.id);
                return previousNode?.x ? previousNode.x : d.x;
            })
            .attr('cy', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.id);
                return previousNode?.y ? previousNode.y : d.y;
            });
        this.edges
            .attr('x1', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.source.id);
                return previousNode?.x ? previousNode.x : d.source.x;})
            .attr('y1', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.source.id);
                return previousNode?.y ? previousNode.y : d.source.y;
            })
            .attr('x2', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.target.id);
                return previousNode?.x ? previousNode.x : d.target.x;
            })
            .attr('y2', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.target.id);
                return previousNode?.y ? previousNode.y : d.target.y;
            });

        this.labels
            .attr('x', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.id);
                return previousNode?.x ? previousNode.x : d.x;
            })
            .attr('y', (d: any) => {
                const previousNode = this.previousNodeMap.get(d.id);
                return previousNode?.y ? previousNode.y : d.y;
            });
    }

    updateYear(event: any): void {
        this.currentYear = +event.target.value;
        // get map of node positions from previous year 
        const year = this.currentYear - 1 < this.minYear ? this.minYear : this.currentYear - 1;
        this.previousNodeMap = new Map(Array.from(this.graphData[year].nodes).map((n: Node) => [n.id, n]));
    
        this.update(this.currentYear);
    }

    download() {
        // download data as JSON
        // create array of nodes and edges per year from this.superGraph
        const data = JSON.stringify(this.graphData[this.currentYear]);

        // const data = JSON.stringify(this.superGraph);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'graphData.json';
        a.click();

        window.URL.revokeObjectURL(url);
    }
}