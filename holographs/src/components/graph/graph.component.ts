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

    private nodes: d3.Selection<any, Node, any, unknown>;
    private edges: d3.Selection<any, Edge, any, unknown>;
    private labels: d3.Selection<any, Node, any, unknown>;
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
            this.currentYear = this.graphData[0].year - 1; // year starts from 1
            this.minYear = this.graphData[0].year - 1;
            this.maxYear = this.graphData[this.graphData.length - 1].year - 1;

            // parse node ids and edge ids and weights to numbers
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

            console.log('superGraph', this.superGraph);

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
            this.update(this.currentYear);
        });
    }

    layout(): void {
        // get width and height of the container graph-container
        const width = document?.getElementById('graph-container')?.clientWidth || 800;
        const height = document?.getElementById('graph-container')?.clientHeight || 800;


        // const width = 800;
        // const height = 800;

        this.simulation = d3.forceSimulation()
            .force('charge', d3.forceManyBody().strength(-900))
            .force('link', d3.forceLink().id((d: any) => d.id).distance(250).strength(0.25))
            .force('center', d3.forceCenter())
            // .force('collide', d3.forceCollide().radius(5))
            .force('x', d3.forceX().strength(0.15))
            .force('y', d3.forceY().strength(0.15))
            .on('tick', this.ticked.bind(this));

        // this.areaScale = d3.scaleSqrt().domain([0, 100]).range([0, 50]);

        // add zoom
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event: any) => {
                d3.selectAll('g').attr('transform', event.transform);
            });

        const svg = d3.select('#graph-container').append('svg')
            .attr('viewBox', [-width/2, -height/2, width, height])
            .attr('width', width)
            .attr('height', height)
            .call(zoom.bind(this));

        const g = svg
            .append('g')
            .attr('id', 'graph');


        this.edges = svg.append('g')
            .attr('class', 'edges')
            .selectAll('line');

        // draw the nodes
        this.nodes = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('circle');

        // this.nodes.exit().remove();

        // draw the labels
        this.labels = svg.append('g')
            .attr('class', 'labels')
            .selectAll('text');
    }

    private update(year: number) {
        console.log('update', year);
        const old = new Map(Array.from(this.nodes.data()).map((n: Node) => [n.id, n]));
        
        const newNodes = Array.from(this.graphData[year].nodes).map((n: Node) => {
            return {...old.get(n.id), ...n};
        });

        const newEdges = Array.from(this.graphData[year].edges);
        
        this.nodes = this.nodes
            .data(newNodes)
            .join('circle')
            .attr('class', 'node')
            .attr('id', (n: Node) => n.id)
            .attr('r', 5)
            .attr('fill', 'white')
            .attr('stroke', 'black');
            // .attr('r', (n: Node) => {
            //     return this.areaScale?.(n.centrality || 0) || 0;
            // });

        // this.edges.exit().remove();
        this.edges = this.edges
            .data(newEdges)
            .join('line')
            .attr('class', 'edge')
            .style('stroke', 'black')
            .style('stroke-width', 2)
            .style('stroke-opacity', 0.5)
            .attr('id', (l: Edge) => l.source + '-' + l.target);

        // this.labels.exit().remove();
        this.labels = this.labels
            .data(newNodes)
            .join('text')
            .attr('class', 'label')
            .text((n: Node) => n.name ? n.name : n.firstname + ' ' + n.lastname)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', 'baseline')
            .attr('fill', 'black')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5)
            .attr('opacity', 0);

        this.simulation?.nodes(newNodes);
        (this.simulation?.force('link') as any).links(newEdges);

        this.simulation?.alpha(1).restart();
    }

    private ticked(): void {
        this.nodes
            .attr('cx', (d: any) => d.x)
            .attr('cy', (d: any) => d.y);
            
        this.edges
            .attr('x1', (d: any) => d.source.x)
            .attr('y1', (d: any) => d.source.y)
            .attr('x2', (d: any) => d.target.x)
            .attr('y2', (d: any) => d.target.y);

        this.labels
            .attr('x', (d: any) => d.x - 5)
            .attr('y', (d: any) => d.y + 5);
    }

    updateYear(event: any): void {
        this.currentYear = +event.target.value;
        this.update(this.currentYear);
    }

    play(): void {
        const interval = setInterval(() => {
            this.currentYear++;
            if (this.currentYear > this.maxYear) {
                clearInterval(interval);
            }
            this.update(this.currentYear);
        }, 1000);
    }

    downloadPNG(): void {
        const svg = document.querySelector('svg');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!svg) {
            return;
        }

        const width = svg?.getAttribute('width') || 800;
        const height = svg?.getAttribute('height') || 800;

        canvas.width = +width;
        canvas.height = +height;

        const image = new Image();
        const svgData = new XMLSerializer().serializeToString(svg as any);
        const svgURL = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgURL);

        image.onload = () => {
            context?.drawImage(image, 0, 0);
            const png = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.download = 'graph.png';
            a.href = png;
            a.click();
        };

        image.src = url;
    }

    download() {
        // download data as JSON
        // create array of nodes and edges per year from this.superGraph
        const nodes = this.nodes.data();
        const edges = this.edges.data();
        const year = this.currentYear;

        const graphData = { year: year, nodes: nodes, edges: edges };
        const data = JSON.stringify(graphData);

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