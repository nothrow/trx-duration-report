import { TestPerformance } from "./types/types";

function formatTime(seconds: number) {
    
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 3600 % 60)

    let r = ''
    if (m > 0)
        r += `${m} m `

    if (s > 0 || m > 0) {
        seconds -= m * 3600
        r += (seconds - m * 3600).toFixed(3) + " s"
        return r
    }
    else
    {
        return (seconds * 1000).toFixed(2) + " ms"
    }
}

export function formatStatistics(results: Array<TestPerformance>) {
    if (results.length == 0)
        return ``;

    const sum = results.reduce((a, b) => a + b.duration, 0);
    const avg = sum / results.length;

    return `<details>
    <summary>Unit test statistics</summary>
    <table>
        <tr><th>Total number</th><td>${results.length}</td></tr>
        <tr><th>Total run time</th><td>${formatTime(sum)}</td></tr>
        <tr><th>Average test run time</th><td>${formatTime(avg)}</td></tr>
        <tr><th>Median run time</th><td>${formatTime(results[Math.trunc(results.length / 2)].duration)}</td></tr>
        <tr><th>95th percentile run time</th><td>${formatTime(results[Math.trunc(results.length * 0.05)].duration)}</td></tr>
    </table>
</details>`;
}


export function formatWorstTests(result: Array<TestPerformance>, topX: number) {
    const header = `<details>
    <summary>Top ${topX} slowest unit tests</summary>
    <table>
        <tr><th>Duration</th><th>Test name</th></tr>
`;

    const body = result.slice(0, topX).map(x => `        <tr><td>${formatTime(x.duration)}</td><td>${x.className}.${x.testName}</td></tr>`).join("\n")

    const footer = `
    </table>
</details>`;

    return header + body + footer;
}

function getMinMax(arr : Array<number>) {
    return arr.reduce(({min, max}, v) => ({
      min: min < v ? min : v,
      max: max > v ? max : v,
    }), { min: arr[0], max: arr[0] });
  }

export function formatHistogram(result: Array<TestPerformance>, bucketCount: number) {
    const header = `<details>
    <summary>Histogram of test speed distribution</summary>
    <style>
        .graph {
            font-family: sans-serif;
            height: 500px;
            width: 800px;
        }
        .graph .labels.x-labels {
            text-anchor: middle;
        }
        .graph .labels.y-labels {
            text-anchor: end;
        }
        .graph .grid {
            stroke: #ccc;
            stroke-dasharray: 0;
            stroke-width: 1;
        }
        .graph .label-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
            fill: black;
        }
    </style>
    <svg version="1.2" class="graph">
        <g class="grid x-grid" id="xGrid">
            <line x1="90" x2="90" y1="5" y2="371"></line>
        </g>
        <g class="grid y-grid" id="yGrid">
            <line x1="90" x2="705" y1="370" y2="370"></line>
        </g>
`

    const footer = `
    </svg>
</details>`;

    const {min, max} = getMinMax(result.map(x => x.duration))
    const bucketSize = (max - min) / bucketCount
    const histogram = Array(bucketCount+1).fill(0)
    for(const test of result) {
        histogram[Math.trunc((test.duration - min) / bucketSize)]++
    }

    const buckets = [];
    for(let i = min; i < max; i+=bucketSize)
    {
        buckets.push(i);
    }

    const maxY = getMinMax(histogram).max;

    const labels = `
    <g class="labels x-labels">
    <text x="100" y="400">${formatTime(buckets[0])}</text>
    <text x="246" y="400">${formatTime(buckets[Math.trunc(buckets.length * 0.25)])}</text>
    <text x="392" y="400">${formatTime(buckets[Math.trunc(buckets.length * 0.50)])}</text>
    <text x="538" y="400">${formatTime(buckets[Math.trunc(buckets.length * 0.75)])}</text>
    <text x="684" y="400">${formatTime(buckets[Math.trunc(buckets.length - 1)])}</text>
    <text x="400" y="440" class="label-title">Duration</text>
  </g>
  <g class="labels y-labels">
    <text x="80" y="15">${maxY}</text>
    <text x="80" y="131">${Math.trunc(maxY * 0.66)}</text>
    <text x="80" y="248">${Math.trunc(maxY * 0.33)}</text>
    <text x="80" y="373">0</text>
    <text x="50" y="200" class="label-title">#</text>
  </g>
`
    let data = `  <g class="bar" transform="translate(90,370) scale(1, -1)">
`
    const graphWidth = 615;
    const bucketWidth = graphWidth / histogram.length

    const graphHeight = 365;
    const normalizationKoef = graphHeight / maxY

    let x = 0;
    for(const bucketItem of histogram) {
        const bucketHeight = bucketItem * normalizationKoef

        data += `<rect x="${x}" height="${bucketHeight}" width="${bucketWidth}"></rect>
`
        x += bucketWidth
    }
    data += `</g>`

    return header + labels + data + footer;
}