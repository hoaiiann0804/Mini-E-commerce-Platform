import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, TextField, CircularProgress } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { normalizeAddress, renderAddress } from '@/utils/addressFormatter';

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
  onLocationSelect: (
    lat: number,
    lng: number,
    address: string,
    normalized?: NormalizedAddress
  ) => void;
  initialPosition?: MapPosition;
  address?: string;
  onAddressChange?: (address: string) => void;
  disabled?: boolean;
}

type NormalizedAddress = {
  address1: string;
  ward: string;
  province: string;
  country: string;
  zip: string;
  lat: number;
  lng: number;
};

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
      console.log(data.address)
      if (data.address) {
        const normalized = normalizeAddress(data) as NormalizedAddress;
        const formattedAddress = renderAddress(normalized);
        setAddress(formattedAddress);
        if (onAddressChange) onAddressChange(formattedAddress);
        onLocationSelect(lat, lng, formattedAddress, normalized);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }, [onAddressChange, onLocationSelect]);




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
          onBlur={handleAddressBlur}
          disabled={disabled}
          multiline
          rows={2}
        />
      </Box>
    </Box>
  );
};

export default AddressMapPicker;
// import { useEffect, useRef, useState, useCallback } from 'react';
// import { Box, TextField, CircularProgress, Paper, Typography } from '@mui/material';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Neutral tile (production safe)
// const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// const DefaultIcon = L.icon({
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });

// L.Marker.prototype.options.icon = DefaultIcon;

// interface MapPosition {
//   lat: number;
//   lng: number;
// }

// interface AddressMapPickerProps {
//   onLocationSelect: (lat: number, lng: number, address: string) => void;
//   initialPosition?: MapPosition;
//   address?: string;
//   onAddressChange?: (address: string) => void;
//   disabled?: boolean;
// }

// const DEFAULT_POSITION: [number, number] = [10.762622, 106.660172];

// const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
//   onLocationSelect,
//   initialPosition,
//   address: externalAddress = '',
//   onAddressChange,
//   disabled = false,
// }) => {
//   const mapRef = useRef<L.Map | null>(null);
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const markerRef = useRef<L.Marker | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [address, setAddress] = useState(externalAddress);
//   const [query, setQuery] = useState('');
//   const [suggestions, setSuggestions] = useState<any[]>([]);

//   // INIT MAP
//   useEffect(() => {
//     if (!mapContainerRef.current) return;

//     const map = L.map(mapContainerRef.current).setView(
//       [initialPosition?.lat || DEFAULT_POSITION[0], initialPosition?.lng || DEFAULT_POSITION[1]],
//       15
//     );

//     L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);

//     map.on('click', async (e) => {
//       if (disabled) return;
//       const { lat, lng } = e.latlng;
//       setMarker(map, lat, lng);
//       await reverseGeocode(lat, lng);
//     });

//     mapRef.current = map;
//     setLoading(false);

//     return () => map.remove();
//   }, [disabled, initialPosition]);

//   // SET MARKER
//   const setMarker = (map: L.Map, lat: number, lng: number) => {
//     if (!markerRef.current) {
//       markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);

//       markerRef.current.on('dragend', async (e) => {
//         const pos = e.target.getLatLng();
//         await reverseGeocode(pos.lat, pos.lng);
//       });
//     } else {
//       markerRef.current.setLatLng([lat, lng]);
//     }

//     map.panTo([lat, lng]);
//   };

//   // REVERSE GEOCODE
//   const reverseGeocode = useCallback(async (lat: number, lng: number) => {
//     try {
//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
//       );
//       const data = await res.json();

//       const addr = data?.display_name || '';
//       setAddress(addr);
//       onAddressChange?.(addr);
//       onLocationSelect(lat, lng, addr);
//     } catch (err) {
//       console.log(err);
//     }
//   }, [onAddressChange, onLocationSelect]);

//   // FORWARD GEOCODE (SEARCH)
//   const searchAddress = async (text: string) => {
//     setQuery(text);

//     if (text.length < 3) {
//       setSuggestions([]);
//       return;
//     }

//     try {
//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${text}`
//       );
//       const data = await res.json();
//       setSuggestions(data.slice(0, 5));
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const selectSuggestion = (item: any) => {
//     const lat = parseFloat(item.lat);
//     const lng = parseFloat(item.lon);

//     if (mapRef.current) {
//       mapRef.current.setView([lat, lng], 16);
//       setMarker(mapRef.current, lat, lng);
//     }

//     setAddress(item.display_name);
//     setSuggestions([]);

//     onLocationSelect(lat, lng, item.display_name);
//   };

//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

//       {/* SEARCH (Grab style) */}
//       <Paper sx={{ p: 1 }}>
//         <TextField
//           fullWidth
//           placeholder="Nhập địa chỉ giao hàng..."
//           value={query}
//           onChange={(e) => searchAddress(e.target.value)}
//         />

//         {suggestions.length > 0 && (
//           <Box>
//             {suggestions.map((s, i) => (
//               <Box
//                 key={i}
//                 sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f2f2f2' } }}
//                 onClick={() => selectSuggestion(s)}
//               >
//                 <Typography fontSize={13}>{s.display_name}</Typography>
//               </Box>
//             ))}
//           </Box>
//         )}
//       </Paper>

//       {/* MAP */}
//       <Box sx={{ position: 'relative' }}>
//         <Box
//           ref={mapContainerRef}
//           sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}
//         />

//         {loading && (
//           <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//             <CircularProgress />
//           </Box>
//         )}
//       </Box>

//       {/* ADDRESS */}
//       <TextField
//         fullWidth
//         label="Địa chỉ đã chọn"
//         value={address}
//         onChange={(e) => {
//           setAddress(e.target.value);
//           onAddressChange?.(e.target.value);
//         }}
//         multiline
//         rows={2}
//         disabled={disabled}
//       />

//     </Box>
//   );
// };

// export default AddressMapPicker;
