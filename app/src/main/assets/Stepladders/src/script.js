/*
Copyright 2014 David Bau.
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function (pool, math) {
    //
    // The following constants are related to IEEE 754 limits.
    //
    var global = this,
        width = 256,        // each RC4 output is 0 <= x < 256
        chunks = 6,         // at least six RC4 outputs for each double
        digits = 52,        // there are 52 significant digits in a double
        rngname = 'random', // rngname: name for Math.random and Math.seedrandom
        startdenom = math.pow(width, chunks),
        significance = math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1,
        nodecrypto;         // node.js crypto module, initialized at the bottom.

    //
    // seedrandom()
    // This is the seedrandom function described above.
    //
    function seedrandom(seed, options, callback) {
        var key = [];
        options = (options == true) ? { entropy: true } : (options || {});

        // Flatten the seed string or build one from local entropy if needed.
        var shortseed = mixkey(flatten(
          options.entropy ? [seed, tostring(pool)] :
          (seed == null) ? autoseed() : seed, 3), key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(key);

        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.
        var prng = function () {
            var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
                d = startdenom,                 //   and denominator d = 2 ^ 48.
                x = 0;                          //   and no 'extra last byte'.
            while (n < significance) {          // Fill up all significant digits by
                n = (n + x) * width;              //   shifting numerator and
                d *= width;                       //   denominator and generating a
                x = arc4.g(1);                    //   new least-significant-byte.
            }
            while (n >= overflow) {             // To avoid rounding up, before adding
                n /= 2;                           //   last byte, shift everything
                d /= 2;                           //   right using integer math until
                x >>>= 1;                         //   we have exactly the desired bits.
            }
            return (n + x) / d;                 // Form the number within [0, 1).
        };

        prng.int32 = function () { return arc4.g(4) | 0; }
        prng.quick = function () { return arc4.g(4) / 0x100000000; }
        prng.double = prng;

        // Mix the randomness into accumulated entropy.
        mixkey(tostring(arc4.S), pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return (options.pass || callback ||
            function (prng, seed, is_math_call, state) {
                if (state) {
                    // Load the arc4 state from the given state if it has an S array.
                    if (state.S) { copy(state, arc4); }
                    // Only provide the .state method if requested via options.state.
                    prng.state = function () { return copy(arc4, {}); }
                }

                // If called as a method of Math (Math.seedrandom()), mutate
                // Math.random because that is how seedrandom.js has worked since v1.0.
                if (is_math_call) { math[rngname] = prng; return seed; }

                    // Otherwise, it is a newer calling convention, so return the
                    // prng directly.
                else return prng;
            })(
        prng,
        shortseed,
        'global' in options ? options.global : (this == math),
        options.state);
    }
    math['seed' + rngname] = seedrandom;

    //
    // ARC4
    //
    // An ARC4 implementation.  The constructor takes a key in the form of
    // an array of at most (width) integers that should be 0 <= x < (width).
    //
    // The g(count) method returns a pseudorandom integer that concatenates
    // the next (count) outputs from ARC4.  Its return value is a number x
    // that is in the range 0 <= x < (width ^ count).
    //
    function ARC4(key) {
        var t, keylen = key.length,
            me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

        // The empty key [] is treated as [0].
        if (!keylen) { key = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) {
            s[i] = i++;
        }
        for (i = 0; i < width; i++) {
            s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
            s[j] = t;
        }

        // The "g" method returns the next (count) outputs as one number.
        (me.g = function (count) {
            // Using instance members instead of closure state nearly doubles speed.
            var t, r = 0,
                i = me.i, j = me.j, s = me.S;
            while (count--) {
                t = s[i = mask & (i + 1)];
                r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
            }
            me.i = i; me.j = j;
            return r;
            // For robust unpredictability, the function call below automatically
            // discards an initial batch of values.  This is called RC4-drop[256].
            // See https://google.com/search?q=rsa+fluhrer+response&btnI
        })(width);
    }

    //
    // copy()
    // Copies internal state of ARC4 to or from a plain object.
    //
    function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
    };

    //
    // flatten()
    // Converts an object tree to nested arrays of strings.
    //
    function flatten(obj, depth) {
        var result = [], typ = (typeof obj), prop;
        if (depth && typ == 'object') {
            for (prop in obj) {
                try { result.push(flatten(obj[prop], depth - 1)); } catch (e) { }
            }
        }
        return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

    //
    // mixkey()
    // Mixes a string seed into a key that is an array of integers, and
    // returns a shortened string seed that is equivalent to the result key.
    //
    function mixkey(seed, key) {
        var stringseed = seed + '', smear, j = 0;
        while (j < stringseed.length) {
            key[mask & j] =
              mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
        }
        return tostring(key);
    }

    //
    // autoseed()
    // Returns an object for autoseeding, using window.crypto and Node crypto
    // module if available.
    //
    function autoseed() {
        try {
            if (nodecrypto) { return tostring(nodecrypto.randomBytes(width)); }
            var out = new Uint8Array(width);
            (global.crypto || global.msCrypto).getRandomValues(out);
            return tostring(out);
        } catch (e) {
            var browser = global.navigator,
                plugins = browser && browser.plugins;
            return [+new Date, global, plugins, global.screen, tostring(pool)];
        }
    }

    //
    // tostring()
    // Converts an array of charcodes to a string
    //
    function tostring(a) {
        return String.fromCharCode.apply(0, a);
    }

    //
    // When seedrandom.js is loaded, we immediately mix a few bits
    // from the built-in RNG into the entropy pool.  Because we do
    // not want to interfere with deterministic PRNG state later,
    // seedrandom will not call math.random on its own again after
    // initialization.
    //
    mixkey(math.random(), pool);

    //
    // Nodejs and AMD support: export the implementation as a module using
    // either convention.
    //
    if ((typeof module) == 'object' && module.exports) {
        module.exports = seedrandom;
        // When in node.js, try using crypto package for autoseeding.
        try {
            nodecrypto = require('crypto');
        } catch (ex) { }
    } else if ((typeof define) == 'function' && define.amd) {
        define(function () { return seedrandom; });
    }

    // End anonymous scope, and pass initial values.
})(
  [],     // pool: entropy pool starts empty
  Math    // math: package containing random, pow, and seedrandom
);

var app = (function() {

    var config = {
        gameBoardSize: 600,
        tilesPerAxis: 10,
        oddTileColor: '#D3E5F3',
        evenTileColor: '#FDFAED',
        textColor: "#000055",
        ladderColor: "blue",
        snakeColor: "#00CC33",
        snakeOutlineColor: "#009922",
        piece: [
            '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="0.0499409in" ' +
            'height="0.0851102in" version="1.1" style="shape-rendering:geometricPrecision; ' +
            'text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"' +
            'viewBox="0 0 0 0"' +
            'xmlns:xlink="http://www.w3.org/1999/xlink">' +
            '<path fill="{color}" d="M0 0c0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0l0 0c0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0l0 0c0,0 0,0 0,0l0 0c0,0 0,0 0,0z"/>' +
            '</svg>'
        ],
        playerColors: ['blue', 'red'],
        ladders: [
            [1, 38],
            [4, 14],
            [9, 31],
            [28, 84],
            [40, 42],
            [51, 67],
            [71, 91],
            [80, 100]
        ],
        snakes: [
            ["98", "98 -2 -7", "82 9 1", "83 -3 -6", "78"],
            ["95", "95 -3 -7", "85 6 3", "86 -2 -3", "75"],
            ["93", "93 7 -1", "89 -6 2", "88 4 -6", "73"],
            ["87", "74 3 7", "75 5 -7", "66 -9 0", "57 3 3", "36 3 4", "24"],
            ["64", "58 2 2", "59 2 7", "60"],
            ["62", "58 5 -3", "39 5 7", "23 3 3", "19"],
            ["56", "56 8 3", "66 0 -7", "54", "53"],
            ["49", "33 3 6", "32 -2 -3", "29", "11"],
            ["47", "47 -4 -8", "35 2 -2", "26 9 9", "26"],
            ["16", "17 7 -3", "5 -4 8", "5"]
        ],
        //A B C D in clockwise order, defaults as "D"
        //eventually these will be autodectected
        textPositions: {
            100: 'A',
            93: 'C',
            88: 'A',
            87: 'C',
            85: 'A',
            84: 'A',
            82: 'C',
            75: 'B',
            68: 'B',
            67: 'A',
            66: 'B',
            65: 'A',
            63: 'A',
            62: 'A',
            58: 'C',
            57: 'C',
            55: 'C',
            48: 'A',
            42: 'B',
            41: 'C',
            36: 'A',
            35: 'A',
            34: 'C',
            29: 'C',
            23: 'C',
            22: 'A',
            20: 'C',
            17: 'A',
            15: 'A',
            16: 'B',
            12: 'C'
        }
    };

    var currentHop = null,
        currentPlayerIndex,
        tileSize,
        gameBoard = null,
        counterRadius,
        inPlay = false,
        endPosition = config.tilesPerAxis * config.tilesPerAxis,
        hotSpots = [],
        button,
        dialog,
        dialogText,
        currentPlayer,
        gridReference,
        basisInterpolator,
        cardinalInterpolator,
        linearInterpolator,
        seededRandom,
        inResize = false,
        pendingResize = false,
        snakePositions;

    var players = [
        {
            name: "Your Turn",
            win: "You Win!",
            position: 0,
            element: null,
            color: 'cyan'
        },
        {
            name: "Computer",
            win: "Computer Wins!",
            position: 0,
            element: null,
            color: 'red'
        }
    ];

    function getRandom(n) {
        return Math.floor(Math.random() * n);
    }

    function setSeededRandom(obj) {
        seededRandom = new Math.seedrandom(JSON.stringify(obj));
    }

    function getSeededRandom(n) {
        return Math.floor(seededRandom() * n);
    }

    function buildMarker(player) {
        if (player.position === 0) {
            return;
        }

        var position = getTileCenter(player.position);

        player.element = gameBoard.append('g')
            .attr("transform", buildTranslate(position));

        player.element.append("circle")
            .style('fill', "#565656")
            .attr("cy", counterRadius * 1.1)
            .attr("cx", counterRadius * 1.1)
            .attr("r", counterRadius * 1.2);

        player.element.append("circle")
            .style('fill', player.color)
            .attr("cx", counterRadius)
            .attr("cy", counterRadius)
            .attr("r", counterRadius);
    }

    function getTileCenter(index) {
        var cell = gridReference[index];
        return { x: cell.x + tileSize / 2, y: cell.y + tileSize / 2 }
    }

    function addGridRef(index, xPos, yPos) {
        gridReference[index] = { x: xPos, y: yPos };
    }

    function run() {

        button = document.getElementById("play");
        dialog = document.getElementById("dialog");
        dialogText = document.getElementById("dialogText");

        currentPlayerIndex = getRandom(2);
        setCurrentPlayer();

        basisInterpolator = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("basis");

        cardinalInterpolator = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("cardinal");

        linearInterpolator = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        gridReference = [];
        buildGameBoard();

    }

    function fixPositionCollisions() {
        var positionMatches = {};
        var matchPositions = [];
        var i;

        for (i = 0; i < players.length; i++) {
            if (players[i].element != null) {
                var match = positionMatches[players[i].position];
                if (!match) {
                    positionMatches[players[i].position] = [i];
                } else {
                    if (match.length === 1) {
                        matchPositions.push(players[i].position);
                    }
                    match.push(i);
                }
            }
        }
        for (i = 0; i < matchPositions.length; i++) {
            var matches = positionMatches[matchPositions[i]];

            var offset = tileSize / matches.length / 1.5;
            var startOffset = -offset * (matches.length - 1) / 2;
            var position = getTileCenter(matchPositions[i]);
            var index = 0;
            while (matches.length > 0) {
                players[matches.pop()].element
                    .attr("transform", buildTranslate(position, startOffset + index * offset, startOffset + index * offset));
                index++;
            }
        }
    }

    function buildGameBoard() {
        var w = window.innerWidth - 60;
        var h = window.innerHeight - 90;
        var snakeIndex;

        var gameBoardSize = config.gameBoardSize;

        if (w < gameBoardSize || h < gameBoardSize) {
            gameBoardSize = Math.max(300, Math.min(w, h));
        }

        document.getElementById("gameBoardOuter").style.width = gameBoardSize + 24 + "px";

        gameBoard = d3.select("#gameBoard")
            .append("svg")
            .attr("width", gameBoardSize)
            .attr("height", gameBoardSize)
            .style("fill", 'black');

        tileSize = gameBoardSize / config.tilesPerAxis;
        var fontSize = tileSize / 4.5;
        var textOffset = tileSize / 12;
        counterRadius = tileSize / 5;

        var odd = true;
        var oddRow = true;
        var labelIndex = 0;

        for (var y = 0; y < config.tilesPerAxis; y++) {

            for (var x = 0; x < config.tilesPerAxis; x++) {

                labelIndex++;

                var xPos = oddRow ? x * tileSize : gameBoardSize - (x + 1) * tileSize;
                var yPos = gameBoardSize - (y + 1) * tileSize;

                addGridRef(labelIndex, xPos, yPos);

                gameBoard.append("rect")
                    .attr("height", tileSize)
                    .attr("width", tileSize)
                    .attr("x", xPos)
                    .attr("y", yPos)
                    .style("fill", odd ? config.oddTileColor : config.evenTileColor);

                var textPosition = config.textPositions[labelIndex] || "D";
                var onLeft = textPosition === "A" || textPosition === "C";
                var onTop = textPosition === "A" || textPosition === "B";

                gameBoard.append("text")
                    .text(labelIndex)
                    .attr("x", (oddRow ? (x + 1) * tileSize : gameBoardSize - (x * tileSize)) + (onLeft ? textOffset - tileSize : -textOffset))
                    .attr("y", gameBoardSize - y * tileSize + (onTop ? -tileSize + 3 * textOffset : -textOffset))
                    .style("text-anchor", onLeft ? "start" : "end")
                    .style("fill", config.textColor)
                    .style("font-size", fontSize + "px");

                odd = !odd;
            }

            oddRow = !oddRow;
        };

        for (snakeIndex = 0; snakeIndex < config.snakes.length; snakeIndex++) {
            buildSnake(snakeIndex);
        }

        var ladderStroke = tileSize / 30;
        var rungStroke = ladderStroke / 2;
        var offset = tileSize / 2;
        var rungSpacing = tileSize / 7;
        var ladderWidth = tileSize / 9;

        for (snakeIndex = 0; snakeIndex < config.ladders.length; snakeIndex++) {

            var ladder = config.ladders[snakeIndex];

            var x1 = gridReference[ladder[0]].x + offset;
            var y1 = gridReference[ladder[0]].y + offset;
            var x2 = gridReference[ladder[1]].x + offset;
            var y2 = gridReference[ladder[1]].y + offset;
            var angle = x2 === x1 ? 90 : Math.atan((y2 - y1) / (x2 - x1));

            var sinAngle = y1 === y2 ? 0 : x2 === x1 ? -1 : Math.sin(angle);
            var cosAngle = y1 === y2 ? 1 : x2 === x1 ? 0 : Math.cos(angle);

            var xOffset = sinAngle * ladderWidth;
            var yOffset = cosAngle * ladderWidth;
            var ladderId = "ladder" + snakeIndex;

            var d = [
                { x: x1 - xOffset, y: y1 + yOffset },
                { x: x2 - xOffset, y: y2 + yOffset }
            ];
            gameBoard.append("path")
                .attr("id", ladderId)
                .attr("d", linearInterpolator(d))
                .attr("stroke", config.ladderColor)
                .style("stroke-width", ladderStroke);

            d = [
                { x: x1 + xOffset, y: y1 - yOffset },
                { x: x2 + xOffset, y: y2 - yOffset }
            ];
            gameBoard.append("path")
                .attr("d", linearInterpolator(d))
                .attr("stroke", config.ladderColor)
                .style("stroke-width", ladderStroke);

            var length = Math.abs(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)));

            var lor = length / rungSpacing;
            var rungCount = Math.floor(lor - 0.5);
            var endPad = (length - (rungCount - 1) * rungSpacing) / 2;
            var padX = cosAngle * endPad;
            var padY = sinAngle * endPad;
            var rungX = cosAngle * rungSpacing;
            var rungY = sinAngle * rungSpacing;

            if (x1 !== x2 && angle > 0) {
                rungX = -rungX;
                rungY = -rungY;
                padX = -padX;
                padY = -padY;
            }

            for (var j = 0; j < rungCount; j++) {

                gameBoard.append("line")
                    .attr("x1", x1 - xOffset + padX + j * rungX)
                    .attr("y1", y1 + yOffset + padY + j * rungY)
                    .attr("x2", x1 + xOffset + padX + j * rungX)
                    .attr("y2", y1 - yOffset + padY + j * rungY)
                    .attr("stroke", config.ladderColor)
                    .style("stroke-width", rungStroke);
            }

            hotSpots[ladder[0]] = { path: ladderId, endPosition: ladder[ladder.length - 1], xOffset: xOffset, yOffset: yOffset }

        }
    }

    function getClosestPositionInfo(pathNode, point) {
        var pathLength = pathNode.getTotalLength(),
            precision = 8,
            best,
            bestLength = 0,
            bestDistance = Infinity;

        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
            if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
                best = scan, bestLength = scanLength, bestDistance = scanDistance;
            }
        }

        // binary search for precise estimate
        precision /= 2;
        while (precision > 0.5) {
            var before,
                after,
                beforeLength,
                afterLength,
                beforeDistance,
                afterDistance;
            if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
                best = before, bestLength = beforeLength, bestDistance = beforeDistance;
            } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
                best = after, bestLength = afterLength, bestDistance = afterDistance;
            } else {
                precision /= 2;
            }
        }

        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return { position: best, length: bestLength };

        function distance2(p) {
            var dx = p.x - point.x,
                dy = p.y - point.y;
            return dx * dx + dy * dy;
        }
    }


    function getTangentPoints(pathNode, position, width) {

        var totalLength = pathNode.getTotalLength(),
            offset = 0.2,
            p1,
            p2;

        if (position < offset) {
            p1 = position;
            p2 = position + offset;
        } else if (position + offset > totalLength) {
            p1 = position - offset;
            p2 = position;
        } else {
            offset = offset / 2;
            p1 = position - offset;
            p2 = position + offset;
        }

        var point = pathNode.getPointAtLength(position);
        p1 = pathNode.getPointAtLength(p1);
        p2 = pathNode.getPointAtLength(p2);
        var delta = {
            x: p2.x - p1.x,
            y: p2.y - p1.y
        }

        return {
            p1: { x: (point.x - delta.x * width), y: (point.y - delta.y * width) },
            p2: { x: (point.x + delta.x * width), y: (point.y + delta.y * width) }
        };
    }

    function buildSnake(snakeIndex) {

        var snake = config.snakes[snakeIndex];
        var snakeStroke = tileSize / 6;

        var data = [];
        var position;

        for (var index = 0; index < snake.length; index++) {
            var snakePos = snake[index].split(" ");

            if (snakePos.length === 1) {
                snakePos[1] = 0;
                snakePos[2] = 0;
            }
            for (var j = 0; j < 3; j++) {
                snakePos[j] = parseInt(snakePos[j]);
            }

            position = getTileCenter(snakePos[0]);
            position.x += tileSize / 20 * snakePos[1];
            position.y -= tileSize / 20 * snakePos[2];
            data.push(position);
        }

        gameBoard.append('circle')
            .style('fill', config.snakeOutlineColor)
            .attr("cx", data[0].x)
            .attr("cy", data[0].y)
            .attr("r", 1.1 * snakeStroke + 1);

        var path = gameBoard.append('path')
            .attr("id", "snake" + snakeIndex)
            .attr("d", cardinalInterpolator(data))
            .attr('stroke-width', 0)
            .attr('fill', 'none');

        hotSpots[snake[0]] = { path: "snake" + snakeIndex, xOffset: 0, yOffset: 0, endPosition: parseInt(snake[snake.length - 1]) };

        var pathNode = path.node();

        setSeededRandom(snake);

        var odd = true;
        var dataDown = [];
        var dataUp = [];

        for (var i = 0; i < snake.length - 1; i++) {
            var width = snakeStroke * (10 + (odd ? (1 + getSeededRandom(4)) : getSeededRandom(4))) / 6;
            var point = data[i];

            var tangentPoints = getTangentPoints(pathNode, getClosestPositionInfo(pathNode, point).length, width);
            var rotatedPoints = rotatePoints(tangentPoints.p1, tangentPoints.p2, Math.PI / 2);

            dataDown.push(rotatedPoints.p1);
            dataUp.push(rotatedPoints.p2);
        }
        var lastPoint = data[data.length - 1];
        dataDown.push(lastPoint);
        dataUp.push(lastPoint);
        dataUp.reverse();

        var dDown = cardinalInterpolator(dataDown);
        var dUp = cardinalInterpolator(dataUp);

        gameBoard.append('path')
            .attr("d", dDown.replace(/([0-9\.]*\,[0-9\.]*$)/, "") + dUp.substr(1) + "L" + dataDown[0].x + "," + dataDown[0].y + "Z")
            .attr('stroke-width', 1)
            .attr('fill', config.snakeColor)
            .attr('stroke', config.snakeOutlineColor);

        gameBoard.append('circle')
            .style('fill', config.snakeColor)
            .attr("cx", data[0].x)
            .attr("cy", data[0].y)
            .attr("r", 1.1 * snakeStroke);

    }

    function rotatePoints(p1, p2, radians) {

        var cos = Math.cos(radians),
            sin = Math.sin(radians),
            delta = {
                x: (cos * (p1.x - p2.x) + sin * (p1.y - p2.y)) / 2,
                y: (cos * (p1.y - p2.y) - sin * (p1.x - p2.x)) / 2
            },
            center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        return {
            p1: {x: center.x - delta.x, y: center.y - delta.y}, 
            p2: {x: center.x + delta.x, y: center.y + delta.y}
        }
    }

    function resize() {

        if (inResize || inPlay || gameBoard == null) {
            pendingResize = true;
            return;
        }
        inResize = true;
        players.forEach(function (player) {
            player.element = null;
        });
        document.getElementById("gameBoard").innerHTML = "";
        buildGameBoard();
        players.forEach(buildMarker);
        fixPositionCollisions();
        inResize = false;
        if (pendingResize) {
            pendingResize = false;
            resize();
        }
    }

    window.onresize = resize;

    function buildHop() {
        if (currentHop != null) {
            currentHop.remove();
        }
        var startIndex = players[currentPlayerIndex].position;
        var startPos = getTileCenter(startIndex);
        var endPos = getTileCenter(startIndex + 1);
        var middlePos = (startPos.x === endPos.x) ?
            { x: startPos.x + tileSize / 3, y: (startPos.y + endPos.y) / 2 } :
            { x: (startPos.x + endPos.x) / 2, y: startPos.y - tileSize / 3 };
        var data = [startPos, middlePos, endPos];

        currentHop = gameBoard.append('path')
            .attr("d", basisInterpolator(data))
            .attr('fill', 'none');

        return currentHop;

    }

    function setCurrentPlayer() {
        document.getElementById('player').innerText = players[currentPlayerIndex].name;

        if (players[currentPlayerIndex].name === "Computer") {
            var computerTimeout = setTimeout(function () {
                inPlay = false;
                play();
                clearTimeout(computerTimeout);
            }, 2000);
        } else {
            inPlay = false;
            button.className = "";
            if (pendingResize) {
                inResize = false;
                resize();
            }
        }
    }

    function roll(callback) {
        var diceElement = document.getElementById('dice');
        var tumbles = 3 + getRandom(5);
        var sequence = [];
        for (var i = 0; i < tumbles; i++) {
            sequence.push(getRandom(6) + 1);
        }
        var rollInterval = setInterval(function () {
            var n = sequence.pop();
            diceElement.className = "dice show" + n;
            if (sequence.length === 0) {
                callback(n);
                clearInterval(rollInterval);
            }
        }, 200);
    }

    function getPathPoints(path) {
        return path.attr("d").split(/[ML]/);
    }

    function animate(path, marker, duration, xOffset, yOffset, callback) {

        var startPoint = getPathPoints(path)[1].split(',');
        startPoint[1] = startPoint[1].split(/Q/)[0];

        marker.attr("transform", "translate(" + startPoint + ")");
        
        transition();

        function transition() {
            marker.transition()
                .duration(duration)
                .attrTween("transform", translateAlong(path.node()))
                .each("end", function () {
                    if (callback) {
                        callback();
                    }
                });
        }

        function translateAlong(path) {
            var l = path.getTotalLength();
            return function () {
                return function (t) {
                    var p = path.getPointAtLength(t * l);
                    return "translate(" + (p.x + xOffset) + "," + (p.y + yOffset) + ")";
                }
            }
        }
    }

    function buildTranslate(position, offsetX, offsetY) {
        return "translate(" + (position.x - counterRadius + (offsetX ? offsetX : 0)) +
            "," + (position.y - counterRadius + (offsetY ? offsetY : 0)) + ")";
    }

    function play() {

        if (inPlay) return;
        inPlay = true;
        button.className = "disabled";

        currentPlayer = players[currentPlayerIndex];

        roll(function (n) {
            n = Math.min(endPosition - currentPlayer.position, n);
            doHop(n);
        });
    }

    function doHop(n) {

        var hopInterval = setInterval(function () {

            if (n > 0) {
                n--;
                if (currentPlayer.position > 0) {
                    var path = buildHop(currentPlayer.position);
                    currentPlayer.position++;
                    animate(path, currentPlayer.element, 300, -counterRadius, -counterRadius, function () { doHop(n) });
                } else {
                    {
                        currentPlayer.position = 1;
                        buildMarker(currentPlayer);
                    }
                    doHop(n);
                }

            } else {

                var hotSpot = hotSpots[currentPlayer.position];
                if (hotSpot) {
                    var hotPath = gameBoard.select("#" + hotSpot.path);
                    animate(hotPath, currentPlayer.element, 2000, -counterRadius + hotSpot.xOffset, -counterRadius - hotSpot.yOffset,
                        function () {
                            currentPlayer.position = hotSpot.endPosition;
                            finishPlay();
                        });
                } else {
                    finishPlay();
                }
            }

            clearInterval(hopInterval);
        }, 50);
    }

    function finishPlay() {

        if (currentPlayer.position === endPosition) {
            dialogText.innerText = currentPlayer.win;
            dialog.className = "dialog show";

        } else {

            fixPositionCollisions();
            currentPlayerIndex++;
            if (currentPlayerIndex === players.length) {
                currentPlayerIndex = 0;
            }
            setCurrentPlayer();
        }
    }

    function reset() {
        players.forEach(function (player) {
            player.position = 0;
            player.element.remove();
            player.element = null;
        });
        currentPlayerIndex = getRandom(2);
        setCurrentPlayer();
        dialog.className = "dialog";
        button.className = "";
        inPlay = false;
    }

    return {
        run: function () {
            var maxTries = 20;
            var interval = setInterval(function () {
                if (typeof d3 !== "undefined") {
                    clearInterval(interval);
                    run();
                } else {
                    maxTries--;
                    if (maxTries === 0) {
                        alert("Could not load d3.js. Check your internet connection.\nIt's possible but not likely that the server is down.");
                        clearInterval(interval);
                    }
                }
            }, 200);
        },
        play: play,
        reset: reset
    }
}());

app.run();