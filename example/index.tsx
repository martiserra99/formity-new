import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Example from './src/example';

import './global.css';

const App = () => {
  return <Example />;
};

ReactDOM.render(<App />, document.getElementById('root'));
