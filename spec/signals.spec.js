'use strict';

var signals = require('../src/signals');

describe('signals - ensure the signal query objects were not modified', function () {
  it('should still be the same Fatigue.Cas.Navigation signal', function () {
    var signal = signals.fatigueCasNavigation();

    expect(Object.keys(signal).length).toBe(3);
    expect(signal.Source).toBe('Fatigue');
    expect(signal.Module).toBe('Cas');
    expect(signal.Name).toBe('Navigation');
  });

  it('should still be the same Fatigue.Cas.Unit signal', function () {
    var signal = signals.fatigueCasUnit();

    expect(Object.keys(signal).length).toBe(3);
    expect(signal.Source).toBe('Fatigue');
    expect(signal.Module).toBe('Cas');
    expect(signal.Name).toBe('Unit');
  });

  it('should still be the same Fatigue.Fusion.Alert signal', function () {
    var signal = signals.fatigueFusionAlert();

    expect(Object.keys(signal).length).toBe(3);
    expect(signal.Source).toBe('Fatigue');
    expect(signal.Module).toBe('Fusion');
    expect(signal.Name).toBe('Alert');
  });

  it('should still be the same Fatigue.Fusion.Frame signal', function () {
    var signal = signals.fatigueFusionFrame();

    expect(Object.keys(signal).length).toBe(3);
    expect(signal.Source).toBe('Fatigue');
    expect(signal.Module).toBe('Fusion');
    expect(signal.Name).toBe('Frame');
  });
});
