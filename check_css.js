const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf8');
let stack = [];
css.split('\n').forEach((line, i) => {
  for (let char of line) {
    if (char === '{') stack.push(i + 1);
    if (char === '}') stack.pop();
  }
});
console.log('Unclosed braces opened at lines:', stack);
