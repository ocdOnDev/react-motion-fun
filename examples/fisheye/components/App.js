import React, { Component } from 'react';
import { Spring } from 'react-motion';
import random from 'lodash/number/random';
import range from 'lodash/utility/range';
import Line from 'react-line';
import fisheye from 'fisheye';

const DISTORTION = 2;
const RADIUS = 400;
const NB_CIRCLES = 100;
const MAX_CIRCLE_RADIUS = 100;

const f = fisheye();

class Circle extends Component {
  constructor() {
    super();
  }
  shouldComponentUpdate(newProps, newState, newContext) {
    return this.props.x != newProps.x || this.props.y != newProps.y || this.props.scale != newProps.scale;
  }
  render() {
    const delta = ~~(255 * this.props.indice / NB_CIRCLES);
    const style = () => ({
      background: `radial-gradient(rgb(${delta}, ${delta}, 255) 0%, rgba(255,255,255,0) 100%) 0 0`,
      border: this.props.indice === 0 ? '1px solid black': '',
      width: this.props.radius,
      height: this.props.radius,
      borderRadius: '50%',
      position: 'absolute',
      transform: `translate(${this.props.x-this.props.radius/2}px, ${this.props.y-this.props.radius/2}px) scale(${this.props.scale})`,
      willChange: 'transform',      
      boxShadow: `5px 5px 20px 0px rgba(0,0,0,.5) inset`,
    });
    return <div style={ style() }></div>;
  }
}

class Zoom extends Component {
  constructor() {
    super();
  }
  render() {
    const style = {
      WebkitFilter: 'blur(0)',
      width: `${this.props.radius}px`,
      height: `${this.props.radius}px`,
      border: '5px solid black',
      borderRadius: '50%',
      position: 'absolute',
      transform: `translate(${this.props.x-this.props.radius/2}px, ${this.props.y-this.props.radius/2}px)`,
      willChange: 'transform', 
      boxShadow: '10px 10px 10px rgba(0,0,0,.2), 10px 10px 10px rgba(0,0,0,.2) inset'
    };

    return <div style={style}></div>
  }
}
function createCircles(count) {
  const margin = MAX_CIRCLE_RADIUS / 2;

  return range(0, count).map(i => ({
        i: i,
        x: random(margin, window.document.body.clientWidth - margin),
        y: random(margin, window.document.body.clientHeight - margin),
        radius: random(20, MAX_CIRCLE_RADIUS),
        scale: 1
      })).map(c => {
        c.originX = c.x;
        c.originY = c.y;
        return c;
      })
}
function d(c1, c2) {
  return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2)); 
}

function findNearest(circles, origin) {
  return circles.reduce((min, circle) => {
    if (d(min, origin) > d(circle, origin)) {
      return circle;
    }
    return min;
  });
}

function orderCirclesByPosition(circles) {
  const len = circles.length;
  const sorted = [ circles[0] ];
  circles.splice(0, 1);
  for (var i = 1; i < len; i++) {
    const nearest = findNearest(circles, sorted[i - 1]);
    nearest.i = i - 1;
    sorted.push(nearest);
    circles.splice(circles.indexOf(nearest), 1);
  }
  return sorted;
}

function createLines(circles) {
  let lines = [];
  for (let i = 1; i < circles.length; i++) {
    const circle = circles[i];
    const prevCircle = circles[i-1];
    lines.push({
        from: { x: prevCircle.x, y: prevCircle.y },
        to: { x: circle.x, y: circle.y }
    });
  }
  return lines;
}

export default class App extends Component {
  constructor() {
    super();

    let circles = createCircles(NB_CIRCLES);
    circles = orderCirclesByPosition(circles);
    const lines = createLines(circles);

    this.state = {
      eye: { x: NaN, y: NaN },
      circles,
      lines
    };
  }

  moveFocus(e) {
    const { clientX: x , clientY: y } = e;
    this.setState({ eye: { x, y } });
    const circles = this.state.circles.map(c => ({ ...c, ...f({x, y})(c) }) );
    this.setState({ circles : circles });
    this.setState({ lines : createLines(circles) });
  }

  render() {
    return (
      <div style={{height: '100%' }} onMouseMove={::this.moveFocus}>
        {this.state.circles.map(c => 
          <Circle key={c.i} indice={c.i} radius={c.radius} x={c.x} y={c.y} scale={c.scale} />
        )}
        {this.state.lines.map((l, i) => 
          <Line key={i} from={l.from} to={l.to} />
        )}
        <Zoom kmey="eye" radius={RADIUS} x={this.state.eye.x} y={this.state.eye.y} scale={1} />
      </div>

    );
  }
}