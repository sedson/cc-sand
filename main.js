import { clamp, randArr } from "./utils.js";
import * as elements from './elements.js';

const { min, max, round, random, floor, sin, cos, tan } = Math;


// Settings for the world.
const width = 80;
const height = 80;
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

  read(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return ['out_of_bounds', -1];
    }
    const ndx = this.xyToIndex(x, y);
    const typeId = this.typesBuffers[this._readIndex][ndx];
    const data = this.dataBuffers[this._readIndex][ndx];
    const type = this.types[typeId];
    if (type !== undefined) {
      return [type.name, data];
    } else {
      // console.log('Found unkown type:', typeId)
      return ['unknown', 0]
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
    this.write(x1, y1, ...this.read(x2, y2));
    this.write(x2, y2, ...this.read(x1, y1));
  }

  swapOffsetIfType(x, y, dx, dy, type) {
    let match = type.indexOf(this.read(x + dx, y + dy)[0]) > -1;
    if (match) {
      this.swap(x, y, x + dx, y + dy);
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
}


const world = new World(Object.values(elements));
world.iterate((x, y) => {
  world.write(x, y, elements.air.name);
});
world.iterate(draw);

console.log(world);


// let neighbor = (x, y, xoff, yoff) => {
//   return readType(x + xoff, y + yoff);
// }

// const randomReflect = () => {
//   return randArr([-1, 0, 1]);
// }


// const swapToOffsetIfType = (x, y, xoff, yoff, type) => {
//   if (readType(x + xoff, y + yoff)?.name === type) {
//     swap(x, y, x + xoff, y + yoff);
//     return true;
//   }
//   return false;
// }

// Logic for one cell's update
const update = (x, y, type, data) => {
  elements[type].update(world, x, y, data);
}

function draw(x, y, type, data) {
  const color = elements[type].color(data);
  pixel(x, y, color);
}

function loop() {
  world.iterate(update);

  if (mouse.down) {
    for (let i = 0; i < 30; i++) {
      let x = mouse.x + round(random() * 10 - 5);
      let y = mouse.y + round(random() * 10 - 5);
      world.write(x, y, selectedElem, floor(random() * 255));
    }
  }

  world.flipBuffers();
  world.iterate(draw);
  requestAnimationFrame(loop);
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