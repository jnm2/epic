import FFT from 'fft.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;

const points = new Array<{ x: number, y: number, segmentLength: number }>();
let unclosedLength = 0;
let unclosedPath = new Path2D();

let fftSize = 4, fft = new FFT(fftSize), input: number[], output: number[];
const components = new Array<{ frequency: number, magnitude: number, phase: number }>();
const rawPoints = new Array<{ x: number, y: number }>();
let _parameter = 0;
let _complexity = 0;
let circles = false;
let hasCapture = false;
let autoFft = true;

const magnitude = (x: number, y: number) => Math.sqrt(x * x + y * y);

const lerp = (first: number, second: number, t: number) => first + (second - first) * t;

const drawComponentsLineIn = (maxI: number, p: number) => {
    let x = 0, y = 0;
    for (let i = 0; i < maxI; i++) {
        const component = components[i];
        const angle = p * component.frequency + component.phase;
        x += component.magnitude * Math.cos(angle);
        y += component.magnitude * Math.sin(angle);
        context.lineTo(x, y);
    }
}

const drawComponentsLineOut = (maxI: number, p: number) => {
    let x = 0, y = 0;
    for (let i = 0; i < maxI; i++) {
        const component = components[i];
        const angle = p * component.frequency + component.phase;
        x += component.magnitude * Math.cos(angle);
        y += component.magnitude * Math.sin(angle);
    }
    context.lineTo(x, y);
}

const redraw = (complexity: number = _complexity, parameter: number = _parameter) => {
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const closedPath = new Path2D(unclosedPath);
    closedPath.closePath();
    context.strokeStyle = 'black';
    context.stroke(closedPath);

    if (components.length > 0) {
        const maxI = Math.min(components.length, (complexity <= 0 ? components.length : (complexity + 1))), pi2 = 2 * Math.PI, p = (parameter * pi2 / fftSize);
        let x = 0, y = 0;

        if (circles) { // Draw arcs?
            const lines = new Array<{ x: number, y: number }>();
            context.beginPath();
            for (let i = 0; i < maxI; i++) {
                const component = components[i];
                const angle = p * component.frequency + component.phase;
                const newX = x + component.magnitude * Math.cos(angle);
                const newY = y + component.magnitude * Math.sin(angle);
                if (i >= 1) { // (min first segment)
                    const ray = Math.sqrt(Math.pow(newX - x, 2) + Math.pow(newY - y, 2));
                    context.moveTo(x, y); // Move to the center, drawing a line to the right most circle point (0°)
                    context.arc(x, y, ray, 0, pi2); // Draw the circle starting from 0 rad (0°) to 2*PI rad (360°)
                    // context.arc do take the x-rightmost point as 0rad, and pathes cursor from the previous position to the modulated position of the center+ray distance circle.
                    // context.arc(A, B, Math.Pi, 2 * Math.Pi) will draw a top-half circle (having it's center on [A, B]), with a line reaching [A, B] if the cursor was not already on this position.
                    // ^ There is no use to begin circles from the [newX, newY] point, as it'd still require the ray calculation, and introduces a new angle -> angle + 2*PI calculation.
                } else {
                    lines.splice(0, lines.length); // Reset lines
                }
                lines.push({ x: newX, y: newY }); // Draw the line starting from old to new coords

                x = newX;
                y = newY;
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

            lines.splice(0, lines.length); // Reset lines
        } else {
            context.beginPath();
            drawComponentsLineIn(maxI, p);
            context.strokeStyle = 'red';
            context.stroke();
        }

        if (complexity > 0) { // Show complexity path
            context.beginPath();
            for (let cp = 0; cp < fftSize; cp++) {
                drawComponentsLineOut(maxI, (cp * pi2 / fftSize));
            }
            drawComponentsLineOut(maxI, 0); // End loop
            context.strokeStyle = 'green';
            context.stroke();
        }
    }
}

const pathReinitialization = () => {
    points.splice(0, points.length);
    unclosedLength = 0;
    unclosedPath = new Path2D();
    components.splice(0, components.length);
}

const samplePathIntoInput = () => {
    const startAndEndPoint = points[points.length - 1];
    const closedLength = unclosedLength + startAndEndPoint.segmentLength;

    let lengthIncludingSegment = 0;
    let previousPoint = startAndEndPoint;
    let segmentStartSample = 0;

    for (let i = 0; i < points.length; i++) {
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

const calculateSortedComponentsFromOutput = () => {
    components.splice(0, components.length);

    for (let i = 0; i < fftSize; i++) {
        const x = output[2 * i], y = output[2 * i + 1];
        components.push({
            frequency: i < fftSize / 2 ? i : i - fftSize,
            magnitude: magnitude(x, y) / fftSize,
            phase: Math.atan2(y, x),
        });
    }

    components.sort((a, b) => b.magnitude - a.magnitude);
}

const addPoint = (x: number, y: number, draw = true) => {
    if (points.length === 0) {
        points.push({ x, y, segmentLength: 0 });
    } else {
        const previousPoint = points[Math.max(0, points.length - 2)];
        const segmentLength = magnitude(x - previousPoint.x, y - previousPoint.y);
        unclosedLength += segmentLength;

        const addedPoint = { x, y, segmentLength };
        points.splice(points.length - 1, 0, addedPoint);

        const startAndEndPoint = points[points.length - 1];
        startAndEndPoint.segmentLength = magnitude(startAndEndPoint.x - x, startAndEndPoint.y - y);
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

const parameterSlider = document.getElementById('parameter-slider') as HTMLInputElement;
_parameter = parameterSlider.valueAsNumber;
parameterSlider.oninput = () => {
    _parameter = parameterSlider.valueAsNumber;
    redraw();
};
const complexityNumber = document.getElementById('complexity-number') as HTMLInputElement;
_complexity = complexityNumber.valueAsNumber;
complexityNumber.oninput = () => {
    _complexity = complexityNumber.valueAsNumber;
    redraw();
};
const complexityCircles = document.getElementById('complexity-circles-check') as HTMLInputElement;
circles = complexityCircles.checked;
complexityCircles.oninput = () => {
    circles = complexityCircles.checked;
    redraw();
};

const updateCanvasSize = () => {
    canvas.width = window.devicePixelRatio * canvas.clientWidth;
    canvas.height = window.devicePixelRatio * canvas.clientHeight;
}

const loadLocation = () => { // Inspiration from https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/21152762#21152762 (qd's not stored)
    window.location.search?.substr(1).split('&')
        .forEach(item => {
            switch (item) {
                case 'circles':
                    complexityCircles.checked = true;
                    break;

                case 'autofft':
                    autoFft = true;
                    break;

                default:
                    { // no-case-declaration
                        const [k, v] = item.split('=');
                        if (v !== null) { // Restriction to valued keys
                            const w = v && decodeURIComponent(v);
                            switch (k) {
                                case 'pt':
                                    { // no-case-declaration
                                        const [x, y] = w.split(';');
                                        if (x !== null && y !== null)
                                            rawPoints.push({ x: Number(x), y: Number(y) });
                                    }
                                    break;

                                case 'range':
                                    _parameter = Number(w);
                                    break;

                                case 'circles':
                                    circles = Boolean(Number(w));
                                    break;

                                case 'complexity':
                                    _complexity = Number(w);
                                    break;

                                case 'fftsize':
                                    autoFft = false;
                                    fftSize = Number(w);
                                    break;

                                case 'autofft':
                                    autoFft = Boolean(Number(w));
                                    break;
                            }
                        }
                    }
                    break;
            }
        });
}

const setLocation= () => {
    let pointsString = '';
    if (points.length > 0)
        for (let i = -1; i < points.length - 1; i++) {
            const pt = points[(i + points.length) % points.length]; // Starting by the last point
            pointsString += `&pt=${pt.x};${pt.y}`;
        }

    const newRelativePathQuery = window.location.pathname + '?' + 'range=' + _parameter + '&' + 'complexity=' + _complexity + '&' + 'circles=' + Number(circles) + pointsString;
    history.pushState(null, '', newRelativePathQuery);
}

const initControls = () => {
    const fftUnderSize = fftSize - 1, minParameter = Math.min(_parameter, fftUnderSize), minComplexity = Math.min(_complexity, fftUnderSize);

    fft = new FFT(fftSize);
    input = fft.createComplexArray();
    output = fft.createComplexArray();
    pathReinitialization();
    rawPoints?.forEach(pt => addPoint(pt.x, pt.y));

    const redrawStart = window.performance.now();
    redraw(minComplexity, minParameter);
    const redrawStop = window.performance.now();

    if (autoFft && (redrawStop - redrawStart) * 2 < 25 && fftSize < 4096) {
        fftSize *= 2;
        initControls();
    } else {
        parameterSlider.max = fftUnderSize.toString();
        _parameter = minParameter;
        parameterSlider.value = _parameter.toString();
        complexityNumber.max = fftUnderSize.toString();
        _complexity = minComplexity;
        complexityNumber.value = _complexity.toString();
        complexityCircles.checked = circles;
    }
}

window.addEventListener('resize', () => { updateCanvasSize(); redraw(); });
updateCanvasSize();
loadLocation();
initControls();

canvas.onpointerdown = (e) => {
    if (e.button === 0) {
        hasCapture = true;
        canvas.setPointerCapture(e.pointerId);
        addPoint(e.offsetX, e.offsetY);
    }
};

canvas.ontouchstart = canvas.ontouchmove = (e) => {
    if (e.touches.length === 1) {
        e.preventDefault();
    }
};

canvas.onpointermove = (e) => {
    if (hasCapture) addPoint(e.offsetX, e.offsetY);
};

canvas.onpointerup = (e) => {
    if (hasCapture) {
        hasCapture = false;
        canvas.releasePointerCapture(e.pointerId);
    }
};

document.getElementById('clear-button')!.onclick = () => {
    pathReinitialization();
    redraw();
};

document.getElementById('save-button')!.onclick = setLocation;
