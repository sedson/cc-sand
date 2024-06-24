import { clamp, randArr } from "./utils.js";
import * as elements from './elements.js';

const { min, max, round, random, floor, sin, cos, tan } = Math;


// Settings for the world.
const width = 100;
const height = 100;
const scale = 6;

// Mouse state. Event handlers at bottom.
const mouse = {
  down: false,
  x: 0,
  y: 0,
};

// Button state.
let selectedElem = 'sand';

for (let e in elements) {
  console.log(e)
  const btn = document.createElement('button');
  btn.innerText = e;
  document.body.append(btn)
  btn.onclick = () => { selectedElem = e };
}


// Canvas setup.
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
document.body.append(canvas);
Object.assign(canvas.style, {
  imageRendering: 'pixelated',
  transform: `scale(${scale})`,
  transformOrigin: 'top left',
  display: 'block',
});
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'yellow';
ctx.fillRect(0, 0, width, height);



// Draw a pixel.
function pixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}


class World {
  constructor(types) {
    this.width = width;
    this.height = height;
    this.types = types;

    this.typeDict = {};
    this.types.forEach((type, i) => {
      this.typeDict[type.name] = i;
    });

    this.typesBuffers = [
      new Uint8Array(this.width * this.height),
      new Uint8Array(this.width * this.height)
    ];

    this.dataBuffers = [
      new Uint8Array(this.width * this.height),
      new Uint8Array(this.width * this.height),
    ];

    this.wroteThisFrame = new Uint8Array(this.width * this.height);

    this._readIndex = 0;
    this._writeIndex = 1;
  }

  iterate(fn) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const [type, data] = this.read(x, y);
        fn(x, y, type, data);
      }
    }
  }

  // assume either bounds have been checked or wrapping behavior is desired
  xyToIndex(x, y) {
    return ((y + this.height) % this.height) * this.width + ((x + this.width) % this.width);
  }

  read(x, y, checkDirty = false) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return ['out_of_bounds', -1];
    }
    const ndx = this.xyToIndex(x, y);

    let bufferId = this._readIndex;

    if (checkDirty && this.wroteThisFrame[ndx]) {
      bufferId = this._writeIndex;
    }

    const typeId = this.typesBuffers[bufferId][ndx];
    const data = this.dataBuffers[bufferId][ndx];
    const type = this.types[typeId];


    if (type !== undefined) {
      return [type.name, data];
    } else {
      // console.log('Found unkown type:', typeId)
      return ['unknown', 0];
    }
  }

  write(x, y, type, data = 0) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      // console.warn('Out of bounds write:', x, y);
      return;
    }
    const ndx = this.xyToIndex(x, y);
    const typeId = this.typeDict[type];
    if (typeId === undefined) {
      // console.warn('Unknown type:', type);
      return;
    }

    this.typesBuffers[this._writeIndex][ndx] = typeId;
    this.dataBuffers[this._writeIndex][ndx] = data;
  }

  swap(x1, y1, x2, y2) {
    const tmp = this.read(x1, y1);
    this.write(x1, y1, ...this.read(x2, y2, true));
    this.write(x2, y2, ...tmp);
  }

  swapOffsetIfType(x, y, dx, dy, type) {
    let match = type.indexOf(this.read(x + dx, y + dy, true)[0]) > -1;
    if (match) {
      this.swap(x, y, x + dx, y + dy);
      this.markDirty(x + dx, y + dy);
      this.markDirty(x, y);

    }
    return match;
  }

  flipBuffers() {
    this._readIndex = (this._readIndex + 1) % 2;
    this._writeIndex = (this._writeIndex + 1) % 2;
    for (let i = 0; i < this.width * this.height; i++) {
      this.typesBuffers[this._writeIndex][i] = 0;
      this.dataBuffers[this._writeIndex][i] = 0;
    }
  }

  clearDirty() {
    for (let i = 0; i < this.width * this.height; i++) {
      this.wroteThisFrame[i] = 0;
    }
  }

  markDirty(x, y) {
    const ndx = this.xyToIndex(x, y);
    this.wroteThisFrame[ndx] = 1;
  }
}


const world = new World(Object.values(elements));
world.iterate((x, y) => {
  world.write(x, y, elements.air.name);
});
world.iterate(draw);


// Logic for one cell's update
const update = (x, y, type, data) => {
  if (world.wroteThisFrame[world.xyToIndex(x, y)]) {
    return;
  }
  elements[type].update(world, x, y, data);
}

function draw(x, y, type, data) {
  pixel(x, y, elements[type].color(data));
}

let frame = 0;

function loop() {
  requestAnimationFrame(loop);
  frame += 1;
  if ((frame % 4) !== 0) {
    // return;
  }

  if (mouse.down) {
    for (let i = 0; i < 20; i++) {
      let x = mouse.x + round(random() * 10 - 5);
      let y = mouse.y + round(random() * 10 - 5);
      world.write(x, y, selectedElem, floor(random() * 255));
      world.markDirty(x, y);
    }
  }

  world.iterate(update);
  world.iterate(draw);
  world.clearDirty();
  world.flipBuffers();
}

loop();

canvas.addEventListener('mousedown', (e) => {
  mouse.down = true;
  const rect = canvas.getBoundingClientRect();
  mouse.x = clamp(round((e.clientX - rect.left) / scale), 0, width - 1);
  mouse.y = clamp(round((e.clientY - rect.top) / scale), 0, height - 1);
});

window.addEventListener('mouseup', () => {
  mouse.down = false;
});

window.addEventListener('mousemove', (e) => {
  if (!mouse.down) return;
  const rect = canvas.getBoundingClientRect();
  mouse.x = clamp(round((e.clientX - rect.left) / scale), 0, width - 1);
  mouse.y = clamp(round((e.clientY - rect.top) / scale), 0, height - 1);
});