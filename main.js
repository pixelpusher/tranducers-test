/**
 * Working out how to create functional pipeline in thi.ng
 */

import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

import * as tx from '@thi.ng/transducers';
import { zigzagColumns2d } from '@thi.ng/grid-iterators';

const cols = 2, rows = 4;

// trivial example, create grid and turn into lazy array of objects
const newFunc = tx.transduce(
  // function to apply
  tx.mapIndexed((i, coords)=>({x:coords[0], y:coords[1]})),
  // reducer (add to array each time)
  tx.push(),
  // data source
  zigzagColumns2d({cols, rows}),  
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

pipeline.push(
  // function to apply
  tx.mapIndexed((i, coords)=>({x:coords[0], y:coords[1]})),
);
pipeline.push(
  tx.mapIndexed((i, coords)=>({x:coords.x/cols, y:coords.y/rows}))
);

const pipelineComposed = tx.comp(...pipeline);

const colsIterator = zigzagColumns2d({cols, rows});

console.log('Next value?')
//console.log(pipelineComposed(colsIterator.next().value));
//console.log(pipelineComposed(colsIterator.next().value));


// this does all the points at once -- iterator takes a tranducer and a generator
// console.log([...tx.iterator(pipelineComposed, colsIterator)]);

// THIS WORKS! Iterative pipeline
console.log(tx.iterator(pipelineComposed, colsIterator).next().value);
console.log(tx.iterator(pipelineComposed, colsIterator).next().value);

const secondPipeline = tx.mapIndexed((i, coords)=>({x:coords.x*10, y:coords.y*10}));

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
  zigzagColumns2d({cols, rows}),  
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
    (i) => Math.sin(i * Math.PI, r),
    tx.normRange(n, false)
  );

console.log(`Poly iter:`);
console.log([...makePolyIter(5,2)]);


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
