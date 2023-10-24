/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */

import '../app.css';
import './histoire.css';

const win = window as unknown as Window & {
  ResizeObserver: any;
};

win.ResizeObserver =
  win.ResizeObserver ||
  class ResizeObserver {
    observe() {}
    disconnect() {}
  };
