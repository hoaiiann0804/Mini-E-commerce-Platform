import React, { useState, useEffect } from 'react';
import { Box, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent, CircularProgress } from '@mui/material';
import { ICountry, IState, ICity } from 'country-state-city';
import { Country, State, City } from 'country-state-city';

interface LocationSelectorsProps {
  onLocationChange: (location: {
    country: string | null;
    state: string | null;
    city: string | null;
    countryCode?: string;
    stateCode?: string;
  }) => void;
  initialValues?: {
    country?: string;
    state?: string;
    city?: string;
  };
}

const LocationSelectors: React.FC<LocationSelectorsProps> = ({ 
  onLocationChange, 
  initialValues = {} 
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(initialValues.country || '');
  const [selectedState, setSelectedState] = useState<string>(initialValues.state || '');
  const [selectedCity, setSelectedCity] = useState<string>(initialValues.city || '');
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false
  });

  const countries = Country.getAllCountries();

  useEffect(() => {
    if (selectedCountry) {
      const countryData = countries.find(c => c.name === selectedCountry);
      if (countryData) {
        setLoading(prev => ({ ...prev, states: true }));
        const countryStates = State.getStatesOfCountry(countryData.isoCode);
        setStates(countryStates);
        setLoading(prev => ({ ...prev, states: false }));
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState && selectedCountry) {
      const countryData = countries.find(c => c.name === selectedCountry);
      if (countryData) {
        const stateData = states.find(s => s.name === selectedState);
        if (stateData) {
          setLoading(prev => ({ ...prev, cities: true }));
          const stateCities = City.getCitiesOfState(countryData.isoCode, stateData.isoCode);
          setCities(stateCities);
          setLoading(prev => ({ ...prev, cities: false }));
        }
      }
    }
  }, [selectedState, selectedCountry]);

  const handleCountryChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedCountry(value);
    setSelectedState('');
    setSelectedCity('');
    setCities([]);
    onLocationChange({
      country: value,
      state: null,
      city: null
    });
  };

  const handleStateChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedState(value);
    setSelectedCity('');
    onLocationChange({
      country: selectedCountry,
      state: value,
      city: null
    });
  };

  const handleCityChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedCity(value);
    onLocationChange({
      country: selectedCountry,
      state: selectedState,
      city: value
    });
  };

  return (
    <Box display="flex" flexDirection="column" gap={2} width="100%">
      <FormControl fullWidth>
        <InputLabel id="country-label">Country</InputLabel>
        <Select
          labelId="country-label"
          value={selectedCountry}
          label="Country"
          onChange={handleCountryChange}
          disabled={loading.countries}
        >
          {countries.map((country) => (
            <MenuItem key={country.isoCode} value={country.name}>
              {country.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="state-label">State/Province</InputLabel>
        <Select
          labelId="state-label"
          value={selectedState}
          label="State/Province"
          onChange={handleStateChange}
          disabled={!selectedCountry || loading.states}
        >
          {states.map((state) => (
            <MenuItem key={state.isoCode} value={state.name}>
              {state.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="city-label">City</InputLabel>
        <Select
          labelId="city-label"
          value={selectedCity}
          label="City"
          onChange={handleCityChange}
          disabled={!selectedState || loading.cities}
        >
          {cities.map((city) => (
            <MenuItem key={city.name} value={city.name}>
              {city.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LocationSelectors;