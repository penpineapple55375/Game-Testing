# Bubble Game (pure CSS)

A Pen created on CodePen.io. Original URL: [https://codepen.io/jkantner/pen/PzXjYa](https://codepen.io/jkantner/pen/PzXjYa).

A bubble-popping game made without using JavaScript. To pull off the popping part, I positioned checkboxes offscreen and used the bubbles as labels. When clicking/tapping these labels (bubbles), each gets display: none; when its corresponding checkbox is checked, incrementing the CSS counter for the score. Basically, the 'for' label attribute and the :checked pseudo class are the key role players here.

Update 11/18/22: Restored after a Sass update broke this Pen