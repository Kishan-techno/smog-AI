import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getAqiToken } from '../utils/aqiTokens';
import { AqiGauge } from '../components/charts/AqiGauge';

describe('AQI Tokens & Gauge', () => {
  it('maps AQI bands consistently', () => {
    expect(getAqiToken(30).label).toBe('Good');
    expect(getAqiToken(145).label).toBe('Moderate');
    expect(getAqiToken(255).label).toBe('Poor');
    expect(getAqiToken(420).label).toBe('Severe');
  });

  it('renders AqiGauge with accessible label', () => {
    render(<AqiGauge aqi={188} category="Moderate" dominantPollutant="PM25" />);
    expect(screen.getByRole('img', { name: /AQI gauge reading 188/i })).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });
});
