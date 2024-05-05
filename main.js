/**
 * Working out how to create functional pipeline in thi.ng
 */

import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

import * as tx from '@thi.ng/transducers';
import { zigzagColumns2d } from '@thi.ng/grid-iterators';
import { TAU, cossin } from "@thi.ng/math";

const cols = 2, rows = 4;

// trivial example, create grid and turn into lazy array of objects
const newFunc = tx.transduce(
  // function to apply
  tx.mapIndexed((i, coords) => ({ x: coords[0], y: coords[1] })),
  // reducer (add to array each time)
  tx.push(),
  // data source
  zigzagColumns2d({ cols, rows }),
);

console.log(`Print 5 values from grid as object instead of 2D array:`);
console.log(
  [...tx.take(5, newFunc
  )]
);

// FAILS -- not a function? 
// trivial example -- normalise values without array
// const newFunc2 = tx.comp(
//   // function to apply
//   tx.mapIndexed((i, coords)=>({x:coords[0], y:coords[1]})),
//   // data source
//   zigzagColumns2d({cols, rows}),  
// );

// console.log(`Normalised grid:`);
// console.log(
//   [...tx.take(5, newFunc2
//   )]
// );


// less trivial example -- stack functions to create flexible pipeline?
// Doesn't work!
// const newFunc3 = tx.comp(
//   // function to apply
//   tx.mapIndexed((i, coords)=>({x:coords.x/cols, y:coords.y/rows})),
//   // data source
//   newFunc2
// );

// console.log(`Composed griddy 3:`);
// console.log(
//   [...tx.take(5, newFunc3)]
// );

// less trivial example -- stack functions to create flexible pipeline?
// Doesn't work!
// const newFunc4 = tx.transduce(
//   // function to apply
//   tx.mapIndexed((i, coords)=>({x:coords.x/cols, y:coords.y/rows})),
//   tx.push(),
//   // data source
//   newFunc2
// );


// console.log(`Composed griddy 3:`);
// console.log(
//   [...tx.take(5, newFunc4)]
// );


// FAILS -- not a function? 
// trivial example -- normalise values without array
const pipeline = [];

const layerHeight = 0.25;

pipeline.push(
  // function to apply
  tx.mapIndexed((i, coords) => ({ x: coords[0], y: coords[1], z: Math.floor(i / (cols * rows)) })),
);
pipeline.push(
  tx.mapIndexed((i, coords) => (
    {
      x: cols == 1 ? 0 : coords.x / (cols - 1),
      y: rows == 1 ? 0 : coords.y / (rows - 1),
      z: coords.z * layerHeight
    }))
);

const pipelineComposed = tx.comp(...pipeline);

const colsIterator = tx.cycle(zigzagColumns2d({ cols, rows }));

console.log('Next value?')
//console.log(pipelineComposed(colsIterator.next().value));
//console.log(pipelineComposed(colsIterator.next().value));


// this does all the points at once -- iterator takes a tranducer and a generator
// console.log([...tx.iterator(pipelineComposed, colsIterator)]);

// THIS WORKS! Iterative pipeline
console.log(tx.iterator(pipelineComposed, colsIterator).next().value);
console.log(tx.iterator(pipelineComposed, colsIterator).next().value);
console.log([...tx.take(2 * rows * cols, tx.iterator(pipelineComposed, colsIterator))]);

// per axis warp

const fsin = (i, x, amt, period) => x + amt * Math.sin(i / (period - 1) * Math.PI);
const flin = (i, x, amt, period) => x + amt * (i / (period - 1));

let startTime = performance.now();

console.log(`WARP TEST BASIC TX ${startTime}`);

const warpTest = tx.transduce(
  tx.mapIndexed((i, coords) => (
    {
      x: fsin(i, coords[0], 0.5, rows),
      y: fsin(i, coords[1], 0.5, rows * cols),
      z: 1
    }
  )),
  tx.push(),
  tx.normRange2d(100, 800)
);
console.log(`WARP TEST BASIC TX DONE ${performance.now()-startTime}`);

console.log(`WARP TEST`);
console.log([...tx.take(rows * cols, warpTest)]);
console.log(`WARP TEST DONE`);

console.log(`WARP TEST -- OBJECT-based, should be same as above`);


//------ more complex object key-based warp test


// NOTE:: this is interesting https://stackoverflow.com/questions/1573593/whats-the-fastest-way-to-iterate-over-an-objects-properties-in-javascript


const coordFunctions = {
  x: (i, x) => fsin(i, x, 0.5, rows),
  y: (i, y) => fsin(i, y, 0.5, rows * cols),
  z: (i, z) => i
};

// good but twice as slow as using explicit functions! 
const applyFunctions = (i, obj) => Object.entries(obj).reduce(
  (accum, current) => {
    // console.log(accum);
    // console.log(current);
    // console.log(`warp axis: ${current[0]}`);
    // console.log(`warp val: ${current[1]}`);
    accum[current[0]] = coordFunctions[current[0]](i, current[1]);
    return accum
  }
  ,{}
);

function applyFunctions2(i, obj)
{
  const obj2 = {

  };
  for (const key of Object.keys(obj)) {
    obj2[key] = coordFunctions[key](i, obj[key]); 
  }
  return obj2;
}


// slower than 2

const AXES = ['x', 'y', 'z'];

function applyFunctions3(i, obj)
{
  const obj2 = {

  };

  for (const axis of AXES) {
    obj2[axis] = coordFunctions[axis](i, obj[axis]); 
  }
  return obj2;
}

console.log("WARPING");

console.log(`warp obj`, applyFunctions(1, { x: 1, y: 0, z: 2 }));

startTime = performance.now();

console.log(`WARP TEST TX0 ${startTime}`);

const warpTestObj = tx.transduce(
  tx.comp(
    tx.mapIndexed((i, coords) =>({ x: coords[0], y: coords[1], z: i })),
    tx.mapIndexed((i, coords) => applyFunctions(i, coords))
  ),

  tx.push(),

  tx.normRange2d(100, 800)
);
console.log(`WARP TEST TX0 DONE ${performance.now()-startTime}`);

startTime = performance.now();
console.log(`WARP TEST TX1 ${startTime}`);

const warpTestObj1a = tx.transduce(
  
  tx.mapIndexed((i, coords) => applyFunctions(i, { x: coords[0], y: coords[1], z: i })),

  tx.push(),

  tx.normRange2d(100, 800)
);
console.log(`WARP TEST TX1 DONE ${performance.now()-startTime}`);


startTime = performance.now();

console.log(`WARP TEST TX2 ${startTime}`);

const warpTestObj2 = tx.transduce(
  
  tx.mapIndexed((i, coords) => applyFunctions2(i, { x: coords[0], y: coords[1], z: i })),

  tx.push(),

  tx.normRange2d(100, 800)
);
console.log(`WARP TEST TX2 DONE ${performance.now()-startTime}`);

startTime = performance.now();

console.log(`WARP TEST TX3 ${startTime}`);

const warpTestObj3 = tx.transduce(
  
  tx.mapIndexed((i, coords) => applyFunctions3(i, { x: coords[0], y: coords[1], z: i })),

  tx.push(),

  tx.normRange2d(100, 800)
);
console.log(`WARP TEST TX3 DONE ${performance.now()-startTime}`);



console.log(`WARP TEST1 OBJ ${performance.now()}`);
console.log([...tx.take(rows * cols, warpTestObj)]);
console.log(`WARP TEST1 DONE ${performance.now()}`);


console.log(`WARP TEST2 OBJ ${performance.now()}`);
console.log([...tx.take(rows * cols, warpTestObj2)]);
console.log(`WARP TEST2 DONE ${performance.now()}`);


console.log(`SECOND PIPELINE TEST -- adding pipelines:`);

const secondPipeline = tx.mapIndexed((i, coords) => ({ x: coords.x, y: coords.y * 10 }));

console.log(tx.iterator(
  tx.comp(
    pipelineComposed,
    secondPipeline
  ),
  colsIterator).next().value
);


// trivial example, create grid and turn into lazy array of objects
const result = tx.transduce(
  // function to apply
  tx.comp(...pipeline),  // reducer (add to array each time)
  tx.push(),
  // data source
  zigzagColumns2d({ cols, rows }),
);

console.log(`Composed griddy pipeline:`);
console.log(
  [...tx.take(5, result)]
);
console.log(
  [...tx.take(5, result)]
);

console.log(`Next in pipeline:`);
console.log(
  result
);



const makePolyIter = (n, r) =>
  tx.map(
    (i) => cossin(i * Math.PI, r),
    tx.normRange(n, true)
  );

console.log(`Poly iter:`);
console.log([...makePolyIter(5, 2)]);


document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

setupCounter(document.querySelector('#counter'))
