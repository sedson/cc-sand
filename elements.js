export const air = {
  name: 'air',
  color: () => 'silver',
  update: () => {},
};

export const water = {
  name: 'water',
  color: (data) => {
    return `rgb(0, 20, ${data * 0.5 + 128})`
  },
  update: (world, x, y, data) => {
    let ref = Math.random() > 0.5 ? 1 : -1;

    let move =
      world.swapOffsetIfType(x, y, 0, 1, 'air') ||
      world.swapOffsetIfType(x, y, ref, 0, 'air');

    if (!move) world.write(x, y, 'water', data);
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
      world.swapOffsetIfType(x, y, 0, 1, 'air water') ||
      world.swapOffsetIfType(x, y, ref, 1, 'air water');

    if (!move) world.write(x, y, 'sand', data);
  },
};