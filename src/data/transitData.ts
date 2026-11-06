import { TransitStop, TransitConnection } from '../types/transit';

/**
 * ACADEMIC NOTICE:
 * All coordinates, road segments, travel durations, and fares provided herein represent
 * realistic simulated data for academic demonstration of Vijayawada, Andhra Pradesh, India.
 * They do not reflect official APSRTC schedules or real-time ticketing tariffs.
 */

export const INITIAL_STOPS: TransitStop[] = [
  { id: 'VJA_RLY', name: 'Vijayawada Railway Station', lat: 16.5186, lon: 80.6195, type: 'Major Railway Hub', zone: 'Central' },
  { id: 'PNBS', name: 'Pandit Nehru Bus Station (PNBS)', lat: 16.5075, lon: 80.6186, type: 'Interstate Bus Terminal', zone: 'Central' },
  { id: 'GOV_PET', name: 'Governorpet', lat: 16.5128, lon: 80.6305, type: 'Commercial Market Node', zone: 'Central' },
  { id: 'BENZ_CIR', name: 'Benz Circle', lat: 16.5002, lon: 80.6508, type: 'Primary Highway Junction', zone: 'East' },
  { id: 'RAM_PADU', name: 'Ramavarappadu Ring', lat: 16.5298, lon: 80.6698, type: 'Ring Road Junction', zone: 'North-East' },
  { id: 'AUTO_NGR', name: 'Autonagar Terminal', lat: 16.4958, lon: 80.6725, type: 'Industrial Terminal', zone: 'East' },
  { id: 'KANURU', name: 'Kanuru', lat: 16.4862, lon: 80.6974, type: 'Educational & Suburban Node', zone: 'South-East' },
  { id: 'PORANKI', name: 'Poranki Center', lat: 16.4754, lon: 80.7182, type: 'Suburban Highway Stop', zone: 'South-East' },
  { id: 'GANNAVARAM', name: 'Gannavaram Bus Stop', lat: 16.5415, lon: 80.7981, type: 'Town Transit Hub', zone: 'Suburban' },
  { id: 'VJA_AIRPORT', name: 'Vijayawada International Airport', lat: 16.5304, lon: 80.7968, type: 'Aviation Terminal', zone: 'Suburban' },
  { id: 'IBRAHIMPATNAM', name: 'Ibrahimpatnam Ferry', lat: 16.5772, lon: 80.5284, type: 'River Corridor Node', zone: 'West' },
  { id: 'GUNADALA', name: 'Gunadala Shrine Stop', lat: 16.5250, lon: 80.6550, type: 'Pilgrimage & Metro Hub', zone: 'North-East' }
];

export const INITIAL_CONNECTIONS: TransitConnection[] = [
  { from: 'VJA_RLY', to: 'PNBS', distanceKm: 1.8, timeMin: 8, fareInr: 10, mode: 'bus' },
  { from: 'VJA_RLY', to: 'GOV_PET', distanceKm: 1.5, timeMin: 6, fareInr: 10, mode: 'bus' },
  { from: 'PNBS', to: 'GOV_PET', distanceKm: 1.9, timeMin: 7, fareInr: 10, mode: 'bus' },
  { from: 'PNBS', to: 'BENZ_CIR', distanceKm: 4.5, timeMin: 14, fareInr: 20, mode: 'bus' },
  { from: 'GOV_PET', to: 'BENZ_CIR', distanceKm: 3.4, timeMin: 11, fareInr: 15, mode: 'bus' },
  { from: 'GOV_PET', to: 'GUNADALA', distanceKm: 3.6, timeMin: 12, fareInr: 15, mode: 'bus' },
  { from: 'GUNADALA', to: 'RAM_PADU', distanceKm: 2.2, timeMin: 8, fareInr: 12, mode: 'bus' },
  { from: 'GOV_PET', to: 'RAM_PADU', distanceKm: 5.2, timeMin: 16, fareInr: 25, mode: 'bus' },
  { from: 'BENZ_CIR', to: 'AUTO_NGR', distanceKm: 3.1, timeMin: 10, fareInr: 15, mode: 'bus' },
  { from: 'BENZ_CIR', to: 'RAM_PADU', distanceKm: 4.2, timeMin: 13, fareInr: 20, mode: 'bus' },
  { from: 'AUTO_NGR', to: 'KANURU', distanceKm: 3.8, timeMin: 12, fareInr: 15, mode: 'bus' },
  { from: 'KANURU', to: 'PORANKI', distanceKm: 2.9, timeMin: 9, fareInr: 15, mode: 'bus' },
  { from: 'AUTO_NGR', to: 'RAM_PADU', distanceKm: 4.8, timeMin: 15, fareInr: 20, mode: 'bus' },
  { from: 'RAM_PADU', to: 'GANNAVARAM', distanceKm: 14.5, timeMin: 25, fareInr: 45, mode: 'bus' },
  { from: 'PORANKI', to: 'GANNAVARAM', distanceKm: 12.0, timeMin: 26, fareInr: 40, mode: 'bus' },
  { from: 'GANNAVARAM', to: 'VJA_AIRPORT', distanceKm: 2.2, timeMin: 6, fareInr: 15, mode: 'bus' },
  { from: 'RAM_PADU', to: 'VJA_AIRPORT', distanceKm: 15.1, timeMin: 28, fareInr: 55, mode: 'bus' },
  { from: 'IBRAHIMPATNAM', to: 'VJA_RLY', distanceKm: 14.0, timeMin: 32, fareInr: 35, mode: 'bus' },
  { from: 'IBRAHIMPATNAM', to: 'PNBS', distanceKm: 15.2, timeMin: 35, fareInr: 40, mode: 'bus' }
];
