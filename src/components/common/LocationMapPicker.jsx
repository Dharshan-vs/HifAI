import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Crosshair,
  CheckCircle2,
  Navigation,
  Search,
  ShieldCheck,
  Loader2,
  Zap,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSmartMeters } from '../../services/smartMeterService';

/**
 * Reverse geocode latitude and longitude to a detailed street-level address.
 * Uses Nominatim OpenStreetMap with high precision.
 */
async function reverseGeocodeCoords(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(',').slice(0, 4).join(',');
        return parts;
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode notice:', err);
  }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const parts = [
        data.locality || data.localityInfo?.administrative?.[3]?.name,
        data.city || data.principalSubdivision,
        data.principalSubdivision,
        data.countryName,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
  } catch {}

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export default function LocationMapPicker({
  value,
  onChange,
  label = 'Smart Meter Live Installation Location & GPS Pin',
  readOnly = false,
  isLocked = false,
}) {
  const [addressInput, setAddressInput] = useState(value?.address || 'Main Road, Dindigul, Tamil Nadu');
  const [lat, setLat] = useState(value?.lat ?? 10.3673);
  const [lon, setLon] = useState(value?.lon ?? 77.9803);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [smartMeterInfo, setSmartMeterInfo] = useState(null);

  // Auto-detect and sync location from registered Smart Meter on mount
  useEffect(() => {
    async function loadSmartMeterSite() {
      try {
        const meters = await fetchSmartMeters('guest');
        if (meters && meters.length > 0) {
          const m = meters[0];
          setSmartMeterInfo(m);
          if (m.lat && m.lon && !value?.isPinned) {
            const mLat = parseFloat(m.lat);
            const mLon = parseFloat(m.lon);
            const mAddr = m.location || 'Smart Meter Site, Dindigul';
            setLat(mLat);
            setLon(mLon);
            setAddressInput(mAddr);
            handleUpdateCoordinates(mAddr, mLat, mLon);
          }
        }
      } catch (err) {
        console.warn('Error loading smart meter site:', err);
      }
    }
    loadSmartMeterSite();
  }, []);

  useEffect(() => {
    if (value?.address) setAddressInput(value.address);
    if (value?.lat !== undefined) setLat(value.lat);
    if (value?.lon !== undefined) setLon(value.lon);
  }, [value]);

  const handleUpdateCoordinates = useCallback(
    (newAddress, newLat, newLon) => {
      const fixedLat = parseFloat(Number(newLat).toFixed(6));
      const fixedLon = parseFloat(Number(newLon).toFixed(6));

      setAddressInput(newAddress);
      setLat(fixedLat);
      setLon(fixedLon);

      try {
        const locObj = {
          address: newAddress,
          lat: fixedLat,
          lon: fixedLon,
          isPinned: true,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('yuga_consumer_location', JSON.stringify(locObj));
        localStorage.setItem('yuga_consumer_location_guest', JSON.stringify(locObj));
        const cityPart = newAddress.split(',')[0].trim();
        localStorage.setItem('hifai_user_city', cityPart);
      } catch {}

      if (onChange) {
        onChange({
          address: newAddress,
          lat: fixedLat,
          lon: fixedLon,
          isPinned: true,
        });
      }
    },
    [onChange]
  );

  const handleGeocodeAddress = async (e) => {
    if (e) e.preventDefault();
    if (!addressInput.trim()) return;

    setGeocoding(true);
    toast.loading(`Pinning live location for "${addressInput}"...`, { id: 'geocode' });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressInput.trim()
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const found = data[0];
        const newLat = parseFloat(parseFloat(found.lat).toFixed(6));
        const newLon = parseFloat(parseFloat(found.lon).toFixed(6));
        const formattedName = found.display_name.split(',').slice(0, 4).join(',');
        handleUpdateCoordinates(formattedName, newLat, newLon);
        toast.success(`📍 Live Smart Meter Location Pinned: ${formattedName}!`, { id: 'geocode' });
      } else {
        // Direct match for Dindigul or local areas
        if (addressInput.toLowerCase().includes('dindigul')) {
          handleUpdateCoordinates(addressInput.trim(), 10.3673, 77.9803);
          toast.success(`📍 Smart Meter Location Pinned: ${addressInput.trim()}`, { id: 'geocode' });
        } else {
          toast.error('Location not found. Please specify city/pincode (e.g. Dindigul, Tamil Nadu).', {
            id: 'geocode',
          });
        }
      }
    } catch (err) {
      console.warn('Geocoding notice:', err);
      toast.dismiss('geocode');
    } finally {
      setGeocoding(false);
    }
  };

  const handleDetectGPS = useCallback(() => {
    setLocating(true);
    toast.loading('Acquiring high-precision GPS satellite coordinates...', { id: 'gps-detect' });

    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newLat = parseFloat(pos.coords.latitude.toFixed(6));
          const newLon = parseFloat(pos.coords.longitude.toFixed(6));
          const addr = await reverseGeocodeCoords(newLat, newLon);

          handleUpdateCoordinates(addr, newLat, newLon);
          setLocating(false);
          toast.success(`✨ Live GPS Pinned: ${addr} (${newLat}, ${newLon})`, { id: 'gps-detect' });
        },
        async (err) => {
          console.warn('Browser GPS notice:', err.message);
          setLocating(false);
          toast.error(`GPS Device note: ${err.message}. Please type your exact street/city to pin directly.`, {
            id: 'gps-detect',
          });
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
      toast.error('Browser geolocation not supported.', { id: 'gps-detect' });
    }
  }, [handleUpdateCoordinates]);

  // Google Maps Iframe Embed with live marker & 15x zoom
  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="font-bold text-navy flex items-center gap-1.5 text-xs">
          <MapPin className="w-4 h-4 text-emerald-600" />
          {label}
        </label>
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-800 rounded-md font-mono text-[10px] font-extrabold border border-emerald-500/20 self-start sm:self-auto">
          ⚡ 5.0 km Microgrid Transfer Radius
        </span>
      </div>

      {/* Smart Meter Sync Callout (shown only when unlocked and linked) */}
      {!isLocked && !readOnly && smartMeterInfo && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-[11px] text-emerald-950">
          <span className="flex items-center gap-1.5 font-semibold">
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Linked Smart Meter: {smartMeterInfo.name} (#{smartMeterInfo.serialNumber})
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-md border border-emerald-500/30">
            GPS Locked
          </span>
        </div>
      )}

      {/* Address Search Bar & GPS Auto-Detect (Hidden when locked/read-only) */}
      {!isLocked && !readOnly ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type your exact location (e.g. Main Road, Dindigul / Nagal Nagar, Dindigul)"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocodeAddress(e)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl font-semibold focus:outline-none focus:border-emerald-500 text-xs text-navy shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={geocoding}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
            >
              {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Pin Location
            </button>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={locating}
              className="px-3 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 rounded-xl border border-cyan-500/30 transition-colors shrink-0 flex items-center gap-1.5 font-bold text-xs shadow-xs"
              title="Detect Exact Device GPS Coordinates"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin text-cyan-600" /> : <Crosshair className="w-4 h-4" />}
              <span className="hidden sm:inline">Use GPS</span>
            </button>
          </div>

          {/* Manual Coordinate Fine-Tuning Toggle */}
          <div className="flex justify-between items-center text-[11px] text-text-secondary pt-0.5">
            <button
              type="button"
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-primary hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showManualCoords ? 'Hide Manual Coordinates' : 'Fine-Tune Exact Lat / Lon'}
            </button>
            <span className="font-mono text-[10px]">
              {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
            </span>
          </div>

          {showManualCoords && (
            <div className="p-3 bg-background border border-border rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                  Latitude (Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleUpdateCoordinates(addressInput, val, lon);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono font-bold text-navy"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                  Longitude (Decimal Degrees)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lon}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) handleUpdateCoordinates(addressInput, lat, val);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-mono font-bold text-navy"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        /* Locked 1-Time Pin Notice */
        <div className="p-3 bg-slate-900 text-slate-200 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-[11px]">
              Physical Smart Meter Location is <strong className="text-emerald-300">Pinned &amp; Permanently Locked</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md font-bold">
            1-Time Pinned
          </span>
        </div>
      )}

      {/* Google Maps Live Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-md h-52 bg-slate-900">
        <iframe
          title="Live Smart Meter Map Pin"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={mapEmbedUrl}
          className="w-full h-full opacity-95"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 bg-navy/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isLocked || readOnly ? '🔒 Locked Physical Meter Pin' : 'Live Smart Meter Pinned Location'}</span>
        </div>

        <div className="absolute bottom-3 right-3 bg-white/95 text-navy px-3 py-1 rounded-lg text-[10px] font-mono font-extrabold border border-border shadow-md flex items-center gap-1">
          <Compass className="w-3 h-3 text-emerald-600" />
          <span>{lat.toFixed(4)}, {lon.toFixed(4)}</span>
        </div>
      </div>

      {/* Verified Location Card */}
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-navy">
            Pinned Location: <strong className="text-emerald-800">{addressInput}</strong>
          </span>
        </div>
        <span className="font-mono text-emerald-700 font-extrabold shrink-0">
          {isLocked || readOnly ? '🔒 Pinned Once & Locked' : 'Smart Meter Locked ✅'}
        </span>
      </div>
    </div>
  );
}
