var when = require('when');
var cytoscape = require('cytoscape');
var domready = require('domready');
var _ = require('underscore');
var $ = require('jquery');
var cyqtip = require('cytoscape-qtip');
var cycola = require('cytoscape-cola');
var cycose = require('cytoscape-cose-bilkent');
var cyarbor = require('cytoscape-arbor');
var cydagre = require('cytoscape-dagre');
var cyspringy = require('cytoscape-springy');
var cyspread = require('cytoscape-spread');

window.$ = $;
window.jQuery = $;

// layouts that have npm, others included via source
var dagre = require('dagre');
var springy = require('springy');

domready(function() {
    var cy;
    cycola(cytoscape, cola);
    cydagre(cytoscape, dagre);
    cyspringy(cytoscape, springy);
    cyarbor(cytoscape, arbor);
    cyspread(cytoscape);
    cycose(cytoscape);
    cyqtip( cytoscape, $ );
    function basename(path) {
        return path.split('/').reverse()[0];
    }

    function submitForm() {
        // input nodes/edges for reblogs and OP
        var nodes = {};
        var edges = {};

        // user form
        var notes = $("#notes").val();
        var layout = $("#layout option:selected").text();

        // process textarea from form
        notes.split("\n").forEach(function(line) {
            var matches = line.match(/(\S+)\t(0.[0-9]+)\t(\S+)/);

            // get reblogs
            if (matches) {
                if (!nodes[matches[1]]) nodes[matches[1]] = {
                    id: matches[1],
                    name: basename(matches[1])
                };
                if (!nodes[matches[3]]) nodes[matches[3]] = {
                    id: matches[3],
                    name: basename(matches[3])
                };
                if (!edges[matches[1] + ',' + matches[3]]) edges[matches[1] + ',' + matches[3]] = {
                    source: matches[1],
                    target: matches[3],
                    score: parseFloat(matches[2])
                };
            }
        });

        var nodes_cy = _.map(nodes, function(node) {
            return {
                "data": node
            };
        });
        var edges_cy = _.map(edges, function(edge) {
            return {
                "data": edge
            };
        });


        // create cytoscape instance
        cy = cytoscape({
            container: document.getElementById('cy'),
            style: cytoscape.stylesheet()
                .selector('node')
                .style({
                    'content': 'data(name)',
                    'text-valign': 'center',
                    'text-outline-width': 2,
                    'text-outline-color': '#000',
                    'color': '#fff'
                })
                .selector('edge')
                .css({
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'haystack',
                    'width': function(elt) { return -Math.log(1-elt.data('score')) * 50; }
                }),
            elements: {
                "nodes": nodes_cy,
                "edges": edges_cy
            },
            // this is an alternative that uses a bitmap during interaction
            textureOnViewport: true,

            // interpolate on high density displays instead of increasing resolution
            pixelRatio: 1,

            // a motion blur effect that increases perceived performance for little or no cost
            motionBlur: true,
            layout: {
                name: layout,
                padding: 10,
                randomize: true,
                animate: true,
                repulsion: 1
            }
        });
        cy.elements().qtip({
            content: function(arg){ return '<b>'+this.data('id')+'</b><br />'+(this.data('score')?'Correlation: '+this.data('score') : this.data('label')); },
            position: {
                my: 'top center',
                at: 'bottom center'
            },
            style: {
                classes: 'qtip-bootstrap',
                'font-family': 'sans-serif',
                tip: {
                    width: 16,
                    height: 8
                }
            }
        });

    }
    


    // resubmit form
    $("#myform").submit(function(e) {
        submitForm();
        return false;
    });


    $("#save_button").on('click', function(e) {
        $("#output").append($("<a/>").attr({
            href: cy.png({
                scale: 3
            })
        }).append("Download picture"));
    });

    submitForm();
});
