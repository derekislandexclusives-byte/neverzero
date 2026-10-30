/* Exposes a React-compatible API (Preact) and the logic module as globals for app.jsx. Must be imported first. */
import * as compat from 'preact/compat';
import { render } from 'preact';
import NZ from './logic.js';
window.React = compat;
window.ReactDOM = {
  createRoot: function (el) {
    return { render: function (vnode) { el.textContent = ''; render(vnode, el); } };
  }
};
window.NZ = NZ;
