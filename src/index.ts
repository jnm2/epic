import FFT from 'fft.js'

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;

const points = new Array<{ x: number, y: number, segmentLength: number }>();
let unclosedLength = 0;
let unclosedPath = new Path2D();

let fftSize = 4096;
let fft = new FFT(fftSize);
let input = fft.createComplexArray() as number[];
let output = fft.createComplexArray() as number[];
const components = new Array<{ frequency: number, magnitude: number, phase: number }>();
const lines = new Array<{ x: number, y: number }>();
let parameter = 0;
let complexity = 0;
let circles: boolean = false;
let hasCapture = false;

const parameterSlider = document.getElementById('parameter-slider') as HTMLInputElement;
parameterSlider.oninput = function () {
    parameter = parameterSlider.valueAsNumber;
    redraw();
};
const complexityNumber = document.getElementById('complexity-number') as HTMLInputElement;
complexityNumber.oninput = function () {
    complexity = complexityNumber.valueAsNumber;
    redraw();
};
const complexityCircles = document.getElementById('complexity-circles-check') as HTMLInputElement;
complexityCircles.oninput = function () {
    circles = complexityCircles.checked;
    redraw();
};

function updateCanvasSize() {
    canvas.width = window.devicePixelRatio * canvas.clientWidth;
    canvas.height = window.devicePixelRatio * canvas.clientHeight;
}

function loadLocation() { //Inspiration from https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/21152762#21152762 (qd's not stored)
    if (window.location.search)
        window.location.search.substr(1).split(`&`)
            .forEach(item => {
                let [k, v] = item.split(`=`);
                if (v != null) { //Restriction to valued keys
                    v = v && decodeURIComponent(v);
                    switch (true) {
                        case (k === 'pt'):
                            let [x, y] = v.split(';');
                            if (x != null && y != null)
                                addPoint(Number(x), Number(y), false);
                            break;

                        case (k === 'range'):
                            parameterSlider.value = v;
                            break;

                        case (k === 'circles'):
                            complexityCircles.checked = Boolean(v);
                            break;

                        case (k === 'complexity'):
                            complexityNumber.value = v;
                            break;

                        case (k === 'fftsize'):
                            fftSize = Number(v);
                            fft = new FFT(fftSize);
                            input = fft.createComplexArray() as number[];
                            output = fft.createComplexArray() as number[];
                            break;

                        default:
                            break;
                    }
                }
            })
}

function setLocation() {
    if (points.length > 0 && 'URLSearchParams' in window) {
        let pointsString: string = '';
        points.forEach(pt => pointsString += '&pt=' + pt.x + ';' + pt.y);

        var newRelativePathQuery = window.location.pathname + '?' + 'range=' + parameter + '&' + 'circles=' + circles + '&' + 'complexity=' + complexity + pointsString;
        history.pushState(null, '', newRelativePathQuery);
    }
}

function initControls() {
    parameterSlider.max = (fftSize - 1).toString();
    parameter = parameterSlider.valueAsNumber;

    complexityNumber.max = (fftSize - 1).toString();
    complexity = complexityNumber.valueAsNumber;

    circles = complexityCircles.checked;
    redraw();
}

window.addEventListener('resize', function() { updateCanvasSize(); redraw(); });
updateCanvasSize();
loadLocation();
initControls();

canvas.onpointerdown = function(e) {
    if (e.button === 0) {
        hasCapture = true;
        canvas.setPointerCapture(e.pointerId);
        addPoint(e.offsetX, e.offsetY);
    }
};

canvas.ontouchstart = canvas.ontouchmove = function(e) {
    if (e.touches.length === 1) {
        addPoint(e.changedTouches[0].clientX - canvas.offsetLeft, e.changedTouches[0].clientY - canvas.offsetTop);
        e.preventDefault();
    }
};

canvas.onpointermove = function(e) {
    if (hasCapture) addPoint(e.offsetX, e.offsetY);
};

canvas.onpointerup = function(e) {
    if (hasCapture) {
        hasCapture = false;
        canvas.releasePointerCapture(e.pointerId);
    }
};

document.getElementById('clear-button')!.onclick = function() {
    points.splice(0, points.length);
    unclosedLength = 0;
    unclosedPath = new Path2D();
    components.splice(0, components.length);
    redraw();
};

document.getElementById('save-button')!.onclick = setLocation;

function magnitude(x: number, y: number) { return Math.sqrt(x * x + y * y); }

function lerp(first: number, second: number, t: number) { return first + (second - first) * t; }

function addPoint(x: number, y: number, draw: boolean = true) {
    if (points.length === 0) {
        points.push({ x, y, segmentLength: 0 });
        points.push({ x, y, segmentLength: 0 });
    } else {
        const previousPoint = points[points.length - 1];
        const segmentLength = magnitude(x - previousPoint.x, y - previousPoint.y);
        unclosedLength += segmentLength;
        points[points.length - 1] = { x, y, segmentLength };
        const firstPoint = points[0];
        points.push({ x: firstPoint.x, y: firstPoint.y, segmentLength: magnitude(firstPoint.x - x, firstPoint.y - y) });
    }

    unclosedPath.lineTo(x, y);

    if (unclosedLength > 0) {
        samplePathIntoInput();
        fft.transform(output, input);
        calculateSortedComponentsFromOutput();
    } else {
        components.splice(0, components.length);
    }

    if (draw) redraw();
}

function samplePathIntoInput() {
    let lengthIncludingSegment = 0;

    let previousPoint = points[0];
    let segmentStartSample = 0;

    const closedLength = unclosedLength + points[points.length - 1].segmentLength;

    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        lengthIncludingSegment += point.segmentLength;

        const segmentEndSample = Math.round(fftSize * lengthIncludingSegment / closedLength);
        const segmentSampleLength = segmentEndSample - segmentStartSample + 1;

        for (let s = segmentStartSample; s < segmentEndSample; s++) {
            const t = (s - segmentStartSample) / segmentSampleLength;
            input[2 * s] = lerp(previousPoint.x, point.x, t);
            input[2 * s + 1] = lerp(previousPoint.y, point.y, t);
        }

        previousPoint = point;
        segmentStartSample = segmentEndSample;
    }
}

function calculateSortedComponentsFromOutput() {
    components.splice(0, components.length);

    for (let i = 0; i < fftSize; i++) {
        const x = output[2 * i], y = output[2 * i + 1];
        components.push({
            frequency: i < fftSize / 2 ? i : i - fftSize,
            magnitude: magnitude(x, y) / fftSize,
            phase: Math.atan2(y, x)
        });
    }

    components.sort((a, b) => b.magnitude - a.magnitude);
}

function redraw() {
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const closedPath = new Path2D(unclosedPath);
    closedPath.closePath();
    context.strokeStyle = 'black';
    context.stroke(closedPath);

    if (components.length > 0) {

        let x = 0, y = 0, maxI = Math.min(components.length, (complexity <= 0 ? components.length : (complexity + 1))), pi2 = 2 * Math.PI, p = (parameter * pi2 / fftSize);

        if (circles) { //Draw arcs?
            let new_x, new_y, ray;
            context.beginPath();
            for (let i = 0; i < maxI; i++) {
                const component = components[i];
                const angle = p * component.frequency + component.phase;
                new_x = x + component.magnitude * Math.cos(angle);
                new_y = y + component.magnitude * Math.sin(angle);
                if (i >= 1) { //(min first segment)
                    ray = Math.sqrt(Math.pow(new_x - x, 2) + Math.pow(new_y - y, 2));
                    context.moveTo(x, y); //Move to the center, drawing a line to the right most circle point (0°)
                    context.arc(x, y, ray, 0, pi2); //Draw the circle starting from 0 rad (0°) to 2*PI rad (360°)
                    //context.arc do take the x-rightmost point as 0rad, and pathes cursor from the previous position to the modulated position of the center+ray distance circle.
                    //context.arc(A, B, Math.Pi, 2 * Math.Pi) will draw a top-half circle (having it's center on [A, B]), with a line reaching [A, B] if the cursor was not already on this position.
                    //^ There is no use to begin circles from the [new_x, new_y] point, as it'd still require the ray calculation, and introduces a new angle -> angle + 2*PI calculation.
                }
                else {
                    lines.splice(0, lines.length); //Reset lines
                }
                lines.push({ x: new_x, y: new_y }); //Draw the line starting from old to new coords

                x = new_x;
                y = new_y;
            }
            context.strokeStyle = 'burlywood';
            context.stroke();

            context.beginPath();
            context.moveTo(lines[0].x, lines[0].y);
            for (let i = 1; i < lines.length; i++) {
                context.lineTo(lines[i].x, lines[i].y);
            }
            context.strokeStyle = 'red';
            context.stroke();

            lines.splice(0, lines.length); //Reset lines
        }
        else {
            context.beginPath();
            drawComponentsLineIn(maxI, p);
            context.strokeStyle = 'red';
            context.stroke();
        }

        if (complexity > 0) { //Show complexity path
            context.beginPath();
            for (let cp = 0; cp < fftSize; cp++) {
                drawComponentsLineOut(maxI, (cp * pi2 / fftSize));
            }
            drawComponentsLineOut(maxI, 0); //End loop
            context.strokeStyle = 'green';
            context.stroke();
        }
    }

    function drawComponentsLineIn(maxI, p) {
        let x = 0, y = 0;
        for (let i = 0; i < maxI; i++) {
            const component = components[i];
            const angle = p * component.frequency + component.phase;
            x += component.magnitude * Math.cos(angle);
            y += component.magnitude * Math.sin(angle);
            context.lineTo(x, y);
        }
    }

    function drawComponentsLineOut(maxI, p) {
        let x = 0, y = 0;
        for (let i = 0; i < maxI; i++) {
            const component = components[i];
            const angle = p * component.frequency + component.phase;
            x += component.magnitude * Math.cos(angle);
            y += component.magnitude * Math.sin(angle);
        }
        context.lineTo(x, y);
    }
}
