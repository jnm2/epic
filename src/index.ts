import FFT from 'fft.js';

class Xy {
    constructor(public x: number, public y: number) { }
}

class Line extends Xy { }

class PointSegment extends Xy {
    constructor(public x: number, public y: number, public segmentLength: number) { super(x, y); }
}

class Component {
    constructor(public frequency: number, public magnitude: number, public phase: number) { }
}

class ParametersManager {
    constructor(public parameter: number = 0, public complexity: number = 0, public circles: boolean = false, public hasCapture: boolean = false, public isMobile: boolean = /Mobi|Android/i.test(navigator.userAgent), public cores: number = navigator.hardwareConcurrency ?? 8) { }

    advisedFft() {
        return this.isMobile ? 1024 : this.cores <= 4 ? 2048 : 4096;
    }
}

class FftManager {
    get fftSize() { return this._fftSize; }
    get fftUnderSize() { return this._fftUnderSize.toString(); }

    private _fftSize: number = parametersManager.advisedFft();
    private min: number = 2;
    private max: number = 65536;
    private _fftUnderSize: number = this.fftSize - 1;
    private fft = new FFT(this.fftSize);
    private input: number[] = [];
    private output: number[] = [];
    private lastChange: number = performance.now();

    constructor(fftSize: number) {
        this.changeFftSize(fftSize);
    }

    changeFftSize(fftSize: number) {
        // console.log('Changing FFT size to', fftSize);
        this._fftSize = fftSize;
        this._fftUnderSize = fftSize - 1;
        this.fft = new FFT(fftSize);
        this.input = this.fft.createComplexArray() as number[];
        this.output = this.fft.createComplexArray() as number[];
        this.lastChange = performance.now();
    }

    computeFft(points: PointSegment[]) {
        this.samplePathIntoInput(points);
        this.transform();
        this.calculateSortedComponentsFromOutput();
    }

    samplePathIntoInput(points: PointSegment[]) {
        const startAndEndPoint = points[points.length - 1];
        const closedLength = componentsManager.unclosedLength + startAndEndPoint.segmentLength;

        let lengthIncludingSegment = 0;
        let previousPoint = startAndEndPoint;
        let segmentStartSample = 0;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            lengthIncludingSegment += point.segmentLength;

            const segmentEndSample = Math.round(this.fftSize * lengthIncludingSegment / closedLength);
            const segmentSampleLength = segmentEndSample - segmentStartSample + 1;

            for (let s = segmentStartSample; s < segmentEndSample; s++) {
                const t = (s - segmentStartSample) / segmentSampleLength;
                this.input[2 * s] = lerp(previousPoint.x, point.x, t);
                this.input[2 * s + 1] = lerp(previousPoint.y, point.y, t);
            }

            previousPoint = point;
            segmentStartSample = segmentEndSample;
        }
    }

    transform() {
        this.fft.transform(this.output, this.input);
    }

    calculateSortedComponentsFromOutput() {
        componentsManager.spliceComponents();

        for (let i = 0; i < this.fftSize; i++) {
            const x = this.output[2 * i], y = this.output[2 * i + 1];
            componentsManager.pushComponent({
                frequency: i < this.fftSize / 2 ? i : i - this.fftSize,
                magnitude: magnitude(x, y) / this.fftSize,
                phase: Math.atan2(y, x),
            });
        }

        componentsManager.components.sort((a, b) => b.magnitude - a.magnitude);
    }

    adaptFft(dt: number) {
        if ((performance.now() - this.lastChange) < 256) // Anti-spam
            return 0;
        else if (dt > 256 && this._fftSize > this.min) // Really awfull performances
            return -2;
        else if (dt >= 28 && this._fftSize > this.min) // Mostly bad performances
            return -1;
        else if (dt < 6 && this._fftSize < this.max) // Really good performances
            return +1;
        else
            return 0;
    }
}

class ComponentsManager {
    components: Component[] = [];
    lines: Line[] = [];
    points: PointSegment[] = [];
    unclosedLength = 0;
    unclosedPath = new Path2D();

    clear() {
        this.splicePoints();
        this.unclosedLength = 0;
        this.unclosedPath = new Path2D();
        this.spliceComponents();
    }

    spliceComponents() {
        splice(this.components);
    }

    splicePoints() {
        splice(this.points);
    }

    spliceLines() {
        splice(this.lines);
    }

    pushComponent(component: Component) {
        push(this.components, component);
    }

    pushLine(line: Line) {
        push(this.lines, line);
    }

    pushPoint(point: PointSegment) {
        push(this.points, point);
    }

    setPointSegment(point: PointSegment, x: number, y: number) {
        point.segmentLength = magnitude(point.x - x, point.y - y);
    }

    addPoint(x: number, y: number) {
        if (this.points.length === 0)
            this.pushPoint({ x, y, segmentLength: 0 });
        else {
            const previousPoint = this.points[Math.max(0, this.points.length - 2)];
            const segmentLength = magnitude(x - previousPoint.x, y - previousPoint.y);
            this.unclosedLength += segmentLength;

            this.points.splice(this.points.length - 1, 0, { x, y, segmentLength });

            this.setPointSegment(this.points[this.points.length - 1], x, y);
        }

        this.unclosedPath.lineTo(x, y);

        if (this.unclosedLength > 0)
            fftManager.computeFft(this.points);
        else
            this.spliceComponents();
    }

    setPointsLocation(encode: string | null): string | null {
        if (componentsManager.points.length <= 0)
            return null;

        let pointsString: string;
        switch (encode) {
            case 'atob':
            case 'btoa': { // no-case-declaration
                const maxI = Math.min(4096, this.points.length);
                pointsString = `&encode=${encode};pt;${encodeBtoa(() => {
                    const nbFloat32 = 2, view = new Float32Array(new ArrayBuffer(maxI * nbFloat32 * 4));
                    const lastPt = this.points[this.points.length - 1], scaleI = this.points.length / maxI;
                    let i = 0;
                    view[i] = lastPt.x; // Starting by the last point (to close the loop)
                    view[i + 1] = lastPt.y;
                    for (i = 1; i <= maxI; i++) {
                        const h = i - 1, j = i * nbFloat32, pt = this.points[Math.floor(h * scaleI)];
                        view[j] = pt.x;
                        view[j + 1] = pt.y;
                    }

                    return view;
                })}`;
            }
                break;

            case 'btoa-na': { // no-case-declaration
                const maxI = Math.min(4096, this.points.length);
                pointsString = `&encode=${encode};pt;${encodeBtoa(() => {
                    const nbFloat32 = 2, view = new Float32Array(new ArrayBuffer(maxI * nbFloat32 * 4)), scaleI = this.points.length / maxI;
                    let lastPt: Xy = this.points[this.points.length - 1];
                    let i = 0;
                    view[i] = lastPt.x; // Starting by the last point (to close the loop)
                    view[i + 1] = lastPt.y;
                    for (i = 1; i <= maxI; i++) {
                        const h = i - 1, j = i * nbFloat32, pt = this.points[Math.floor(h * scaleI)];
                        view[j] = pt.x - lastPt.x;
                        view[j + 1] = pt.y - lastPt.y; // Relative to the previous point (expected near)
                        lastPt = pt;
                    }

                    return view;
                })}`;
            }
                break;

            default: { // no-case-declaration
                const lastPt = this.points[this.points.length - 1];
                pointsString = `&pt=|${lastPt.x};${lastPt.y}`; // Starting by the last point (to close the loop)
                const maxI = Math.min(256, this.points.length - 1), scaleI = this.points.length / maxI;
                for (let i = 0; i < maxI; i++) {
                    const pt = this.points[Math.floor(i * scaleI)]; // Scaling resolution up to 256 pts
                    pointsString += `|${pt.x};${pt.y}`;
                }
            }
        }
        return pointsString;
    }

    setComponentsLocation(encode: string | null): string | null {
        if (this.components.length <= 0)
            return null;

        let componentsString: string;
        switch (encode) {
            case 'atob':
            case 'btoa': { // no-case-declaration
                const maxI = Math.min(4096, this.components.length - 1);
                componentsString = `&encode=${encode};cp;${encodeBtoa(() => {
                    const nbFloat32 = 3, view = new Float32Array(new ArrayBuffer(maxI * 3 * 4)); // RangeError: byte length of Float32Array should be a multiple of 4 (needs a padding to be at complete 4)
                    this.components.forEach((cp, i) => {
                        const j = i * nbFloat32;
                        view[j] = cp.frequency;
                        view[j + 1] = cp.magnitude;
                        view[j + 2] = cp.phase;
                    });

                    return view;
                })}`;
            }
                break;

            default: { // no-case-declaration
                componentsString = '&cp=';
                const maxI = Math.min(256, this.components.length - 1);
                for (let i = 0; i < maxI; i++) {
                    const cp = this.components[i]; // Keeping resolution up to 256 components
                    componentsString += `|${cp.frequency};${cp.magnitude};${cp.phase}`;
                }
            }
        }
        return componentsString;
    }
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;

const parametersManager = new ParametersManager();
const fftManager = new FftManager(parametersManager.advisedFft());
const componentsManager = new ComponentsManager();

const parameterSlider = document.getElementById('parameter-slider') as HTMLInputElement;
parameterSlider.oninput = function() {
    parametersManager.parameter = parameterSlider.valueAsNumber;
    redraw();
};
const complexityNumber = document.getElementById('complexity-number') as HTMLInputElement;
complexityNumber.oninput = function() {
    parametersManager.complexity = complexityNumber.valueAsNumber;
    redraw();
};
const complexityCircles = document.getElementById('complexity-circles-check') as HTMLInputElement;
complexityCircles.oninput = function() {
    parametersManager.circles = complexityCircles.checked;
    redraw();
};

function updateCanvasSize() {
    canvas.width = window.devicePixelRatio * canvas.clientWidth;
    canvas.height = window.devicePixelRatio * canvas.clientHeight;
}

function loadLocation() { // Inspiration from https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/21152762#21152762 (qd's not stored)
    window.location.search?.substring(1).split('&')
        .forEach(item => {
            switch (item) {
                case 'circles':
                    complexityCircles.checked = true;
                    break;

                default: { // no-case-declaration
                    const [k, v] = item.split('=');
                    if (v === null)
                        return; // Restriction to valued keys

                    const w = v && decodeURIComponent(v);
                    switch (k) {
                        case 'pt':
                            if (w.startsWith('|')) // format &pt=|;|;|...
                                w.substring(1).split('|').forEach(loadPoint);
                            else // format &pt=;&pt=;&pt=...
                                loadPoint(w);
                            break;

                        case 'range':
                            parameterSlider.value = w;
                            break;

                        case 'circles':
                            complexityCircles.checked = Boolean(Number(w));
                            break;

                        case 'complexity':
                            complexityNumber.value = w;
                            break;

                        case 'fftsize':
                            fftManager.changeFftSize(Number(w));
                            break;

                        case 'cp':
                            if (w.startsWith('|')) // format &cp=|;;|;;|...
                                w.substring(1).split('|').forEach(loadComponent);
                            else // format &cp=;;&cp=;;&cp=...
                                loadComponent(w);
                            break;

                        case 'encode': { // no-case-declaration
                            const [e, t, c] = w.split(';');
                            processDecode(c, t, e);
                        }
                            break;
                    }
                }
                    break;
            }
        });
}

function loadPoint(w: string) {
    const [x, y] = w.split(';');
    if (x !== null && y !== null)
        componentsManager.addPoint(Number(x), Number(y));
}

function loadComponent(w: string) {
    const [f, m, p] = w.split(';');
    if (f !== null && m !== null && p !== null)
        componentsManager.pushComponent({ frequency: Number(f), magnitude: Number(m), phase: Number(p) });
}

function setPointsLocation(encode: string | null = null) {
    setLocation(componentsManager.setPointsLocation(encode));
}

function setComponentsLocation(encode: string | null = null) {
    setLocation(componentsManager.setComponentsLocation(encode));
}

function setLocation(complement: string | null) {
    if (complement === null)
        return;

    const newRelativePathQuery = window.location.pathname + '?' + 'range=' + parametersManager.parameter + '&' + 'complexity=' + parametersManager.complexity + '&' + 'circles=' + Number(parametersManager.circles) + complement;
    history.pushState(null, '', newRelativePathQuery);
}

function encodeBtoa(setView: () => Float32Array) {
    let binary = '';
    const chunkSize = 0x8000, bytes = new Uint8Array(setView().buffer); // Buffer to deplete

    for (let i = 0; i < bytes.length; i += chunkSize)
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize)); // bytes->binary

    return btoa(binary);
}

function decodeBtoa(str: string, unsetView: (view: Float32Array) => void) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length); // Buffer to complete

    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i); // binary->bytes

    return unsetView(new Float32Array(bytes.buffer));
}

function processDecode(complement: string, type: string, encode: string | null) {
    switch (encode) {
        case 'atob':
        case 'btoa':
            switch (type) {
                case 'pt':
                    return decodeBtoa(complement, view => {
                        for (let i = 0; i < view.length;)
                            componentsManager.addPoint(view[i++], view[i++]);
                    });

                case 'cp':
                    return decodeBtoa(complement, view => {
                        for (let i = 0; i < view.length;)
                            componentsManager.pushComponent({ frequency: view[i++], magnitude: view[i++], phase: view[i++] });
                    });

                default:
                    return atob(complement);
            }

        case 'btoa-na':
            switch (type) {
                case 'pt':
                    return decodeBtoa(complement, view => {
                        let iVw = 0;
                        let prevPoint: Xy = { x: view[iVw++], y: view[iVw++] };
                        componentsManager.addPoint(prevPoint.x, prevPoint.y); // First point is absolute
                        for (; iVw < view.length;) { // i starts at 2
                            const pt = { x: view[iVw++], y: view[iVw++] };
                            prevPoint = { x: prevPoint.x + pt.x, y: prevPoint.y + pt.y }; // Relative to the previous point (expected near)
                            componentsManager.addPoint(prevPoint.x, prevPoint.y);
                        }
                    });

                default:
                    return complement;
            }

        default:
            return complement;
    }
}

function initControls() {
    const fftUnderSize = fftManager.fftUnderSize;
    parameterSlider.max = fftUnderSize;
    parametersManager.parameter = parameterSlider.valueAsNumber;

    complexityNumber.max = fftUnderSize;
    parametersManager.complexity = complexityNumber.valueAsNumber;

    parametersManager.circles = complexityCircles.checked;
    redraw();
}

window.addEventListener('resize', function() { updateCanvasSize(); redraw(); });
updateCanvasSize();
loadLocation();
initControls();

canvas.onpointerdown = function(e) {
    if (e.button === 0) {
        parametersManager.hasCapture = true;
        canvas.setPointerCapture(e.pointerId);
        addPoint(e.offsetX, e.offsetY);
    }
};

canvas.ontouchstart = canvas.ontouchmove = function(e) {
    if (e.touches.length === 1)
        e.preventDefault();
};

canvas.onpointermove = function(e) {
    if (parametersManager.hasCapture)
        addPoint(e.offsetX, e.offsetY);
};

canvas.onpointerup = function(e) {
    if (parametersManager.hasCapture) {
        parametersManager.hasCapture = false;
        canvas.releasePointerCapture(e.pointerId);
    }
};

document.getElementById('clear-button')!.onclick = function() {
    componentsManager.clear();
    redraw();
};

document.getElementById('save-points-raw-button')!.onclick = () => setPointsLocation();
document.getElementById('save-points-b64-button')!.onclick = () => setPointsLocation('btoa-na');
document.getElementById('save-components-raw-button')!.onclick = () => setComponentsLocation();
document.getElementById('save-components-b64-button')!.onclick = () => setComponentsLocation('btoa');

function push<T>(collection: T[], element: T) {
    return collection.push(element);
}

function splice<T>(collection: T[]) {
    return collection.splice(0, collection.length);
}

function magnitude(x: number, y: number) {
    return Math.sqrt(x * x + y * y);
}

function lerp(first: number, second: number, t: number) {
    return first + (second - first) * t;
}

function addPoint(x: number, y: number) {
    // Thanks Copilot for this perf measure + shift idea.
    const t0 = performance.now();

    componentsManager.addPoint(x, y);
    redraw();

    const dt = performance.now() - t0;
    const changeFft = fftManager.adaptFft(dt);
    // console.log('FFT adapt:', { dt, changeFft, fftSize: fftManager.fftSize });
    if (changeFft) {
        fftManager.changeFftSize(changeFft > 0 ? fftManager.fftSize << changeFft : fftManager.fftSize >> -changeFft);
        const fftUnderSize = fftManager.fftUnderSize;
        parameterSlider.max = fftUnderSize;
        parametersManager.parameter = parameterSlider.valueAsNumber;
        complexityNumber.max = fftUnderSize;
        parametersManager.complexity = complexityNumber.valueAsNumber;
    }
}

function redraw() {
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    if (componentsManager.unclosedLength > 0) {
        const closedPath = new Path2D(componentsManager.unclosedPath);
        closedPath.closePath();
        context.strokeStyle = 'black';
        context.stroke(closedPath);
    }

    if (componentsManager.components.length > 0) {
        const maxI = Math.min(componentsManager.components.length, (parametersManager.complexity <= 0 ? componentsManager.components.length : (parametersManager.complexity + 1))), pi2 = 2 * Math.PI, p = (parametersManager.parameter * pi2 / fftManager.fftSize), _x = 0, _y = 0;

        if (parametersManager.circles) { // Draw arcs?
            let x = _x, y = _y;
            context.beginPath();
            for (let i = 0; i < maxI; i++) {
                const component = componentsManager.components[i];
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
                } else
                    componentsManager.spliceLines(); // Reset lines

                componentsManager.pushLine({ x: newX, y: newY }); // Draw the line starting from old to new coords

                x = newX;
                y = newY;
            }
            context.strokeStyle = 'burlywood';
            context.stroke();

            context.beginPath();
            const firstLine = componentsManager.lines[0];
            context.moveTo(firstLine.x, firstLine.y);
            for (let i = 1; i < componentsManager.lines.length; i++) {
                const line = componentsManager.lines[i];
                context.lineTo(line.x, line.y);
            }

            context.strokeStyle = 'red';
            context.stroke();

            componentsManager.spliceLines(); // Reset lines
        } else {
            context.beginPath();
            drawComponentsLineIn(maxI, p, _x, _y);
            context.strokeStyle = 'red';
            context.stroke();
        }

        if (parametersManager.complexity > 0) { // Show complexity path
            context.beginPath();
            for (let cp = 0; cp < fftManager.fftSize; cp++)
                drawComponentsLineOut(maxI, (cp * pi2 / fftManager.fftSize), _x, _y);

            drawComponentsLineOut(maxI, 0, _x, _y); // End loop
            context.strokeStyle = 'green';
            context.stroke();
        }
    }

    function drawComponentsLineIn(maxI: number, p: number, x: 0, y: 0) {
        for (let i = 0; i < maxI; i++) {
            const component = componentsManager.components[i];
            const angle = p * component.frequency + component.phase;
            x += component.magnitude * Math.cos(angle);
            y += component.magnitude * Math.sin(angle);
            context.lineTo(x, y);
        }
    }

    function drawComponentsLineOut(maxI: number, p: number, x: 0, y: 0) {
        for (let i = 0; i < maxI; i++) {
            const component = componentsManager.components[i];
            const angle = p * component.frequency + component.phase;
            x += component.magnitude * Math.cos(angle);
            y += component.magnitude * Math.sin(angle);
        }
        context.lineTo(x, y);
    }
}
