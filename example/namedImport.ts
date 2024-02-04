import {first,last} from "lodash";

let words = ['sky', 'wood', 'forest', 'falcon',
    'pear', 'ocean', 'universe'];

let fel = first(words);
let lel = last(words);

console.log(`First element: ${fel}`);
console.log(`Last element: ${lel}`);
