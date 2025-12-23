// Location Picker Component - Share current location

import { memo, useState, useEffect } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface LocationPickerProps {
  onSend: (location: LocationData) => void;
  onCancel: () => void;
}

export const LocationPicker = memo(function LocationPicker({ onSend, onCancel }: LocationPickerProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị.');
      setIsLoading(false);
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy,
      };

      // Try to get address from reverse geocoding (optional)
      try {
        const address = await reverseGeocode(latitude, longitude);
        locationData.address = address;
      } catch (err) {
        console.warn('Failed to get address:', err);
      }

      setLocation(locationData);
      setIsLoading(false);
    };

    const handleError = async (err: GeolocationPositionError) => {
      console.log('Geolocation failed:', err.code);

      let errorMessage = 'Không thể lấy vị trí.';
      let helpText = '';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Quyền truy cập vị trí bị từ chối';
          helpText = 'Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt (biểu tượng khóa/ổ khóa trên thanh địa chỉ)';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Không thể xác định vị trí';
          helpText = 'Vui lòng kiểm tra: 1) GPS/Location đã bật chưa, 2) Có kết nối internet không, 3) Thử ra ngoài trời nếu đang ở trong nhà';
          break;
        case err.TIMEOUT:
          errorMessage = 'Hết thời gian chờ lấy vị trí';
          helpText = 'GPS đang mất nhiều thời gian. Vui lòng: 1) Ra ngoài trời hoặc gần cửa sổ, 2) Bật GPS/Location trên thiết bị, 3) Thử lại';
          break;
      }
      
      setError(errorMessage + (helpText ? '\n\n' + helpText : ''));
      setIsLoading(false);
    };

    // Thử lấy vị trí với độ chính xác thấp trước (nhanh hơn)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      () => {
        // Nếu thất bại với độ chính xác thấp, thử với độ chính xác cao
        console.log('Low accuracy failed, trying high accuracy...');
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleError,
          {
            enableHighAccuracy: true,
            timeout: 60000, // 60 giây cho high accuracy
            maximumAge: 60000, // Cho phép cache 1 phút
          }
        );
      },
      {
        enableHighAccuracy: false, // Thử low accuracy trước
        timeout: 15000, // 15 giây
        maximumAge: 300000, // Cho phép cache 5 phút
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ChatApp/1.0', // Required by Nominatim
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch address');
    
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  useEffect(() => {
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    if (location) {
      onSend(location);
    }
  };

  const getMapUrl = (lat: number, lng: number): string => {
    // Google Maps static image API (requires API key for production)
    // For now, using OpenStreetMap tile server
    const zoom = 15;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <h3 className="font-semibold text-gray-800">Chia sẻ vị trí</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-600">Đang lấy vị trí của bạn...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="w-16 h-16 text-red-500 mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button
              onClick={getCurrentLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {location && !isLoading && !error && (
          <div className="space-y-3">
            {/* Map preview (placeholder - in production use real map) */}
            <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">Vị trí hiện tại</p>
                </div>
              </div>
              
              {/* Actual map implementation would go here */}
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
              />
            </div>

            {/* Location info */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {location.address || 'Vị trí hiện tại'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  {location.accuracy && (
                    <p className="text-xs text-gray-400 mt-1">
                      Độ chính xác: ±{Math.round(location.accuracy)}m
                    </p>
                  )}
                </div>
              </div>

              {/* View on map link */}
              <a
                href={getMapUrl(location.latitude, location.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <span>Xem trên bản đồ</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                </svg>
              </a>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Gửi vị trí
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
