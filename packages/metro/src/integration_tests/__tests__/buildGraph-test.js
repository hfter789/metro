/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 * @format
 */

'use strict';

const Metro = require('../../..');

const path = require('path');

jest.unmock('cosmiconfig');

jest.setTimeout(120 * 1000);

const JestHasteMap = require('jest-haste-map');

jest.mock('jest-haste-map', () => {
  const JestHasteMap = require.requireActual('jest-haste-map');
  const mockConstructor = jest.fn((...args) => new JestHasteMap(...args));
  mockConstructor.ModuleMap = JestHasteMap.ModuleMap;
  Object.keys(JestHasteMap);
  return mockConstructor;
});
describe('Build Graph', () => {
  beforeEach(() => {
    JestHasteMap.mockClear();
  });
  it('should build the dependency graph', async () => {
    const entryPoint = path.resolve(
      __dirname,
      '..',
      'basic_bundle',
      'TestBundle.js',
    );

    const config = await Metro.loadConfig({
      config: require.resolve('../metro.config.js'),
    });

    const graph = await Metro.buildGraph(config, {
      entries: [entryPoint],
    });

    expect(
      Array.from(graph.dependencies.entries()).map(([filePath, dep]) => ({
        file: path.basename(filePath),
        types: dep.output.map(output => output.type),
      })),
    ).toEqual([
      {file: 'TestBundle.js', types: ['js/module']},
      {file: 'Bar.js', types: ['js/module']},
      {file: 'Foo.js', types: ['js/module']},
      {file: 'test.png', types: ['js/module/asset']},
      {file: 'AssetRegistry.js', types: ['js/module']},
      {file: 'TypeScript.ts', types: ['js/module']},
    ]);

    expect(graph.dependencies.get(entryPoint)).toEqual(
      expect.objectContaining({
        path: entryPoint,
        inverseDependencies: new Set(),
        output: [
          expect.objectContaining({
            type: 'js/module',
          }),
        ],
      }),
    );

    expect(graph.dependencies.get(entryPoint).output).toMatchSnapshot();
  });
  it('JestHasteMap should initialize with watch = false', async () => {
    const entryPoint = path.resolve(
      __dirname,
      '..',
      'basic_bundle',
      'TestBundle.js',
    );

    const config = await Metro.loadConfig({
      config: require.resolve('../metro.config.js'),
    });

    await Metro.buildGraph(
      {...config, watch: false},
      {
        entries: [entryPoint],
      },
    );
    expect(JestHasteMap.mock.calls[0][0].watch).toBeFalsy();
  });
});
