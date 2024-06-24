export const air = {
  name: 'air',
  color: () => 'silver',
  update: () => {},
};

export const wall = {
  name: 'wall',
  color: () => 'black',
  update: (world, x, y, data) => {
    world.write(x, y, 'wall', data);
    world.markDirty(x, y);
  },
};


export const water = {
  name: 'water',
  color: (data) => {
    return `rgb(0, 20, ${data * 0.5 + 128})`
  },
  update: (world, x, y, data) => {
    let ref = Math.random() > 0.5 ? 1 : -1;

    let move =
      world.swapOffsetIfType(x, y, 0, 1, 'air gas') ||
      world.swapOffsetIfType(x, y, ref, 1, 'air gas') ||
      world.swapOffsetIfType(x, y, ref, 0, 'air gas');

    if (!move) {
      world.write(x, y, 'water', data);
      world.markDirty(x, y);
    }
  },
};

export const sand = {
  name: 'sand',
  color: (data) => {
    return `rgb(${data * 0.25 + 200}, 100, 20)`
  },
  update: (world, x, y, data) => {
    let ref = Math.random() > 0.5 ? 1 : -1;

    let move =
      world.swapOffsetIfType(x, y, 0, 1, 'air water gas') ||
      world.swapOffsetIfType(x, y, ref, 1, 'air water gas');

    if (!move) {
      world.write(x, y, 'sand', data);
      world.markDirty(x, y);
    }
  },
};


export const gas = {
  name: 'gas',
  color: (data) => {
    return `lime`;
  },
  update: (world, x, y, data) => {
    let refX = Math.random() > 0.5 ? 1 : -1;
    let refY = Math.random() > 0.5 ? 1 : -1;


    let move =
      world.swapOffsetIfType(x, y, refX, -1, 'water sand') ||
      world.swapOffsetIfType(x, y, refX, refY, 'air');

    if (!move) {
      world.write(x, y, 'gas', data);
      world.markDirty(x, y);
    }
  },
};