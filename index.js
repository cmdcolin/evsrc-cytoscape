var cytoscape = require('cytoscape');
var _ = require('underscore');
var cyqtip = require('cytoscape-qtip');
var weaver = require('weaverjs');
var cose_bilkent = require('cytoscape-cose-bilkent');
var dagre = require('cytoscape-dagre');
var spread = require('cytoscape-spread');
var panzoom = require('cytoscape-panzoom');
var euler = require('cytoscape-euler');
var klay = require('cytoscape-klay');
var cyforcelayout = require('cytoscape-ngraph.forcelayout');
var cola = require('cytoscape-cola')

function downloadURI(uri, name) {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
// layouts that have npm, others included via source

$(function () {
    var cy;
    console.log(cola)
    cytoscape.use(cola);
    cytoscape.use(cose_bilkent)
    cytoscape.use(dagre);
    cytoscape.use(klay);
    cytoscape.use(euler);

    spread(cytoscape, weaver);
    cyforcelayout(cytoscape);
    cyqtip(cytoscape);
    panzoom(cytoscape);
    function basename(path) {
        return path.split('/').reverse()[0];
    }

    function submitForm() {
        // input nodes/edges for reblogs and OP
        var nodes = {};
        var edges = {};

        // user form
        var notes = $('#notes').val();
        var mincor = 1;
        var maxcor = 0;

        // process textarea from form
        notes.split('\n').forEach(function (line) {
            var matches = line.match(/(\S+)\t(0.[0-9]+)\t(\S+)/);

            // get reblogs
            if (matches) {
                if (!nodes[matches[1]]) {
                    nodes[matches[1]] = {
                        id: matches[1],
                        name: basename(matches[1]),
                    };
                }
                if (!nodes[matches[3]]) {
                    nodes[matches[3]] = {
                        id: matches[3],
                        name: basename(matches[3]),
                    };
                }
                if (!edges[`${matches[1]},${matches[3]}`]) {
                    edges[`${matches[1]},${matches[3]}`] = {
                        source: matches[1],
                        target: matches[3],
                        score: parseFloat(matches[2]),
                    };
                }
                if (mincor > matches[2]) {
                    mincor = matches[2];
                }
                if (maxcor < matches[2]) {
                    maxcor = matches[2];
                }
            }
        });

        var nodesCy = _.map(nodes, function (node) {
            return {
                data: node,
            };
        });
        var edgesCy = _.map(edges, function (edge) {
            return {
                data: edge,
            };
        });


        // create cytoscape instance
        cy = cytoscape({
            container: document.getElementById('cy'),
            style: cytoscape.stylesheet()
                .selector('node')
                .style({
                    content: 'data(name)',
                    'text-valign': 'center',
                    'text-outline-width': 2,
                    'text-outline-color': '#000',
                    color: '#fff',
                })
                .selector('edge')
                .css({
                    width: '5px',
                    'line-color': function (elt) { var s = (elt.data('score') - mincor) * 200 / (maxcor - mincor); return `hsl(${s},40%,60%)`; },
                }),
            elements: {
                nodes: nodesCy,
                edges: edgesCy,
            },
            // this is an alternative that uses a bitmap during interaction
            textureOnViewport: true,

            // interpolate on high density displays instead of increasing resolution
            pixelRatio: 'auto',

            // a motion blur effect that increases perceived performance for little or no cost
            motionBlur: true,
            layout: {
                name: $('#layout option:selected').text().trim(),
                ungrabifyWhileSimulating: true,
                nodeSpacing: $('#node_repulsion').val(),
                randomize: true,
                handleDisconnected: true,
                animate: $('#animate').prop('checked'),
            },
        });


        var defaults = {
            zoomFactor: 0.05,
            zoomDelay: 45,
            minZoom: 0.1,
            maxZoom: 10,
            fitPadding: 50,
            panSpeed: 10,
            panDistance: 10,
            panDragAreaSize: 75,
            panMinPercentSpeed: 0.25,
            panInactiveArea: 8,
            panIndicatorMinOpacity: 0.5,
            zoomOnly: false,
            fitSelector: undefined,
            animateOnFit: () => false,
            fitAnimationDuration: 1000,
            sliderHandleIcon: 'fa fa-minus',
            zoomInIcon: 'fa fa-plus',
            zoomOutIcon: 'fa fa-minus',
            resetIcon: 'fa fa-expand',
        };

        cy.panzoom(defaults);
        cy.elements().qtip({
            content: function () { var cor = this.data('score') ? `Correlation: ${this.data('score')}` : this.data('name'); return `<b>${this.data('id')}</b><br />${cor}`; },
            position: {
                my: 'top center',
                at: 'bottom center',
            },
            style: {
                classes: 'qtip-bootstrap',
                'font-family': 'sans-serif',
                tip: {
                    width: 16,
                    height: 8,
                },
            },
        });
    }

    // resubmit form
    $('#myform').submit(() => {
        submitForm();
        return false;
    });

    function redraw() {
        var layout = cy.makeLayout({
            name: $('#layout option:selected').text().trim(),
            ungrabifyWhileSimulating: true,
            nodeSpacing: $('#node_repulsion').val(),
            randomize: false,
            handleDisconnected: true,
            animate: $('#animate').prop('checked'),
        });

        layout.run();
    }
    $('#node_repulsion').on('change', redraw);
    $('#layout').on('change', redraw);
    $('#save_button').on('click', () => {
        downloadURI(cy.png({ scale: 3 }), 'out.png');
    });

    submitForm();
});
