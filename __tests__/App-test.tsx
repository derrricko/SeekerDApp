/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  let tree: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(<App />);
  });

  expect(tree!.toJSON()).toBeTruthy();

  // Unmount to stop in-flight animations before Jest tears down
  await act(async () => {
    tree!.unmount();
  });
}, 15000);
