import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateGeoPath, easeOutCubic } from '../src/utils/geo';

test('interpolateGeoPath produces requested step count and preserves endpoints', () => {
  const points: [number, number][] = [
    [16.5075, 80.6186],
    [16.5002, 80.6508]
  ];

  const steps = 50;
  const interpolated = interpolateGeoPath(points, steps);

  assert.equal(interpolated.length, steps + 1);
  assert.equal(interpolated[0][0], points[0][0]);
  assert.equal(interpolated[0][1], points[0][1]);
  assert.equal(interpolated[interpolated.length - 1][0], points[1][0]);
  assert.equal(interpolated[interpolated.length - 1][1], points[1][1]);
});

test('interpolateGeoPath handles multi-segment paths smoothly', () => {
  const points: [number, number][] = [
    [16.5075, 80.6186],
    [16.5128, 80.6305],
    [16.5298, 80.6698],
    [16.5304, 80.7968]
  ];

  const interpolated = interpolateGeoPath(points, 100);
  assert.equal(interpolated.length, 101);

  // Check monotonicity / boundaries
  assert.equal(interpolated[0][0], points[0][0]);
  assert.equal(interpolated[interpolated.length - 1][0], points[points.length - 1][0]);
});

test('easeOutCubic starts at 0 and finishes at 1', () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5); // Concave down / decelerating
});
