import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
    selector: 'app-graph',
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

    constructor() { }

    ngOnInit() {
        this.drawGraph();
    }

    drawGraph() {
    }
}