describe('jest-preset', () => {
  it('allows to use typescript', () => {
    const calculator = require('./setup/calculator').default;
    expect(calculator(2, 40)).toEqual(42);
  });

  it('allows to use flow', () => {
    const calculator = require('./setup/calculator-flow').default;
    expect(calculator(2, 40)).toEqual(42);
  });

  it('allows to require hops runtime code', () => {
    const hops = require('hops');
    expect(hops.render).toBeDefined();
  });

  it('allows to import global css inside a js module', () => {
    // if it does not throw it appears to work
    require('./setup/global-css');
  });

  it('allows to import local css inside a js module', () => {
    const css = require('./setup/local-css');
    expect(css.default.foo).toBe('foo');
  });

  it('allows to use importComponent', done => {
    const React = require('react');
    const renderer = require('react-test-renderer');
    const Component = require('./setup/import-component').default;
    const { MemoryRouter } = require('react-router-dom');

    const rendered = renderer.create(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );

    expect(rendered.root.findAllByType('h1').length).toBe(0);

    window.setTimeout(() => {
      expect(rendered.root.findAllByType('h1')[0].children[0]).toEqual('hello');
      expect(rendered.root.findAllByType('h1')[1].children[0]).toEqual('bye');
      done();
    }, 0);
  });
});
