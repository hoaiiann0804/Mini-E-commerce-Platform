import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, TextField, CircularProgress } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPosition {
  lat: number;
  lng: number;
}

interface AddressMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialPosition?: MapPosition;
  address?: string;
  onAddressChange?: (address: string) => void;
  disabled?: boolean;
}

const DEFAULT_POSITION: [number, number] = [10.762622, 106.660172]; // Ho Chi Minh City

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  onLocationSelect,
  initialPosition,
  address: externalAddress = '',
  onAddressChange,
  disabled = false,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState(externalAddress);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const initMap = async () => {
      try {
        const leafletMap = L.map(mapContainerRef.current!).setView(
          [initialPosition?.lat || DEFAULT_POSITION[0], initialPosition?.lng || DEFAULT_POSITION[1]],
          15
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(leafletMap);

        // Handle map click
        leafletMap.on('click', (e) => {
          if (disabled) return;
          const { lat, lng } = e.latlng;
          updateMarkerPosition(leafletMap, lat, lng);
          reverseGeocode(lat, lng);
        });

        // Add initial marker if position is provided
        if (initialPosition) {
          updateMarkerPosition(leafletMap, initialPosition.lat, initialPosition.lng);
        }

        // Fix for map sizing
        setTimeout(() => {
          leafletMap.invalidateSize();
        }, 100);

        mapRef.current = leafletMap;
        setIsLoading(false);

        return () => {
          leafletMap.remove();
        };
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, [disabled, initialPosition]);

  const updateMarkerPosition = useCallback((map: L.Map, lat: number, lng: number) => {
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], {
        draggable: !disabled,
      }).addTo(map);

      markerRef.current.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        reverseGeocode(lat, lng);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    map.panTo([lat, lng]);
  }, [disabled]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data.display_name) {
        const newAddress = data.display_name;
        setAddress(newAddress);
        if (onAddressChange) onAddressChange(newAddress);
        onLocationSelect(lat, lng, newAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }, [onAddressChange, onLocationSelect]);

    // Search for locations
    const searchLocation = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching location:', error);
            setSearchResults([]);
        }
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchLocation(query);
    };

    // Handle search result selection
    const handleSelectResult = async (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        if (map) {
            updateMarkerPosition(map, lat, lng);
            await reverseGeocode(lat, lng);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    // Handle address input blur
    const handleAddressBlur = () => {
        if (address && address !== externalAddress && onAddressChange) {
            onAddressChange(address);
        }
    };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box
        ref={mapContainerRef}
        sx={{
          height: '400px',
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          opacity: disabled ? 0.7 : 1,
          '& .leaflet-container': {
            height: '100%',
            width: '100%',
          },
        }}
      >
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1000,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>

      <Box mt={2}>
        <TextField
          fullWidth
          label="Địa chỉ"
          value={address}
          onChange={(e) => {
            const newAddress = e.target.value;
            setAddress(newAddress);
            if (onAddressChange) onAddressChange(newAddress);
          }}
          disabled={disabled}
          multiline
          rows={2}
        />
      </Box>
    </Box>
  );
};

export default AddressMapPicker;
