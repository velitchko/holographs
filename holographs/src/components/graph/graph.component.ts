import { Component, ElementRef, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';

type Node = {
    id: number;
    firstname?: string;
    lastname?: string;
    name?: string;
    centrality?: number;
};

type Edge = {
    source: number;
    target: number;
    weight: number;
    year: number;
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
    private nodeMap: Map<number, Node> = new Map<number, Node>();

    private nodes: d3.Selection<SVGCircleElement, Node, SVGGElement, unknown> | undefined;
    private edges: d3.Selection<SVGLineElement, Edge, SVGGElement, unknown> | undefined;
    private labels: d3.Selection<SVGTextElement, Node, SVGGElement, unknown> | undefined;
    private areaScale: d3.ScalePower<number, number> | undefined;

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
    }

    ngOnInit(): void {
        this.loadGraphData();
    }

    loadGraphData(): void {
        this.http.get('../assets/data/hpgraphData.json').subscribe(data => {
            this.graphData = data as Array<GraphData>;
            this.currentYear = this.graphData[0].year;
            this.minYear = this.graphData[0].year;
            this.maxYear = this.graphData[this.graphData.length - 1].year;

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
            const allEdges = this.graphData.flatMap((d: GraphData) => d.edges);
            
            console.log('All Edges:', allEdges);
            
            // filter edges that are below the 90th percentile of edge weights
            const filteredEdges = allEdges.filter((e: any) => e.weight >= (d3.quantile(edgeWeights.flat(), 0.9) || 0));
            console.log('Filtered Edges:', filteredEdges);

            const filteredNodes = new Set(filteredEdges.flatMap((e: Edge) => [e.source, e.target]));

            // create a super graph
            this.superGraph.nodes = new Set(Array.from(filteredNodes).map((n: number) => this.nodeMap.get(n) as Node));
            this.superGraph.edges = new Set(filteredEdges);

            this.layout();
        });
    }

    layout(): void {
            // get width and height of the container graph-container
            const width = document?.getElementById('graph-container')?.clientWidth || 800;
            const height = document?.getElementById('graph-container')?.clientHeight || 800;

            this.areaScale = d3.scaleSqrt().domain([0, 100]).range([0, 50]);

            const radius = Math.min(width, height) / 2;


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



        // iterate over this.graphData and draw the graph
        this.graphData.forEach((d: GraphData, i: number) => {
                    const angle = 2 * Math.PI / this.graphData.length * i;
                    const x = width / 2 + radius * Math.cos(angle);
                    const y = height / 2 + radius * Math.sin(angle);
                    const year = d.year;
                
                    // draw the edges
                    this.edges = g.selectAll('line');

                    this.edges
                        .data(this.superGraph.edges)
                        .join('line')
                        .style('stroke', 'white')
                        .style('stroke-width', 2)
                        .attr('id', (l: Edge) => l.source + '-' + l.target)
                        .attr('opacity', (l: Edge) => {
                            return l.year === this.currentYear ? 1 : 0;
                        });

                    this.edges.exit().remove();

                    // draw the nodes
                    this.nodes = g.selectAll('circle');

                    this.nodes
                        .data(this.superGraph.nodes)
                        .join('circle')
                        .attr('r', (n: Node) => {
                            return this.areaScale?.(n.centrality || 0) || 0;
                        })
                        .attr('cx', x)
                        .attr('cy', y)
                        .attr('id', (n: Node) => n.id)
                        .attr('fill', 'black')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 2);

                    this.nodes.exit().remove();

                    // draw the labels
                    this.labels = g.selectAll('text');

                    this.labels
                        .data(this.superGraph.nodes)
                        .join('text')
                        .text((n: Node) => n.name ? n.name : n.firstname + ' ' + n.lastname)
                        .attr('fill', 'white');

                });

            const simulation = d3.forceSimulation(Array.from(this.superGraph.nodes) as d3.SimulationNodeDatum[])
                .force('link', d3.forceLink(Array.from(this.superGraph.edges)).id((d: any) => d.id).distance(400).strength(1))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05));

            simulation.on('tick', () => {
                this.edges?.attr('x1', (d: any) => d.source.x)
                    .attr('y1', (d: any) => d.source.y)
                    .attr('x2', (d: any) => d.target.x)
                    .attr('y2', (d: any) => d.target.y);

                this.nodes?.attr('cx', (d: any) => d.x)
                    .attr('cy', (d: any) => d.y);

                this.labels?.attr('x', (d: any) => d.x + 10)
                    .attr('y', (d: any) => d.y - 10);
            });
        }

    updateYear(event: any): void {
            const year = event.target.value;
            this.currentYear = +year;

            // update the edges
            this.edges?.attr('opacity', (l: Edge) => {
                // find if edge exists in this.graphData.edges for the current year
                return l.year === this.currentYear ? 1 : 0;
            });
        }

    download() {
            // download data as JSON
            const data = JSON.stringify(this.graphData);
            const blob = new Blob([data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graphData.json';
            a.click();

            window.URL.revokeObjectURL(url);


        }
}