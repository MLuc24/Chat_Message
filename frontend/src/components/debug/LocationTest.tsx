   // Simple Location Test Component - For debugging geolocation issues

import { useState } from 'react';

export function LocationTest() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    let output = '=== LOCATION DEBUG TEST ===\n\n';

    // 1. Check protocol
    output += `1. Protocol: ${window.location.protocol}\n`;
    output += `   Hostname: ${window.location.hostname}\n`;
    const isValid = window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';
    output += `   Valid: ${isValid ? '✅' : '❌'}\n\n`;

    // 2. Check geolocation support
    const hasGeo = 'geolocation' in navigator;
    output += `2. Geolocation supported: ${hasGeo ? '✅' : '❌'}\n\n`;

    // 3. Check permission
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        output += `3. Permission state: ${result.state}\n\n`;
      } catch (err) {
        output += `3. Permission API error: ${err}\n\n`;
      }
    } else {
      output += `3. Permissions API not supported\n\n`;
    }

    // 4. Test geolocation
    output += '4. Testing geolocation...\n';
    setResult(output);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        output += `   ✅ SUCCESS!\n`;
        output += `   Latitude: ${pos.coords.latitude}\n`;
        output += `   Longitude: ${pos.coords.longitude}\n`;
        output += `   Accuracy: ${pos.coords.accuracy}m\n\n`;
        
        // 5. Test Nominatim
        output += '5. Testing Nominatim API...\n';
        setResult(output);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await response.json();
          output += `   ✅ Nominatim OK!\n`;
          output += `   Address: ${data.display_name}\n\n`;
        } catch (err) {
          output += `   ❌ Nominatim Error: ${err}\n\n`;
        }

        output += '=== ALL TESTS PASSED ✅ ===';
        setResult(output);
        setIsLoading(false);
      },
      (err) => {
        output += `   ❌ FAILED!\n`;
        output += `   Error code: ${err.code}\n`;
        output += `   Error message: ${err.message}\n\n`;
        
        switch(err.code) {
          case 1:
            output += '   → PERMISSION_DENIED\n';
            output += '   Fix: Allow location in browser settings\n';
            break;
          case 2:
            output += '   → POSITION_UNAVAILABLE\n';
            output += '   Fix: Check GPS/WiFi settings\n';
            break;
          case 3:
            output += '   → TIMEOUT\n';
            output += '   Fix: Check network connection\n';
            break;
        }

        output += '\n=== TEST FAILED ❌ ===';
        setResult(output);
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-md z-50">
      <h3 className="font-bold text-gray-800 mb-2">Location Debug Test</h3>
      <button
        onClick={runTest}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-3"
      >
        {isLoading ? 'Testing...' : 'Run Test'}
      </button>
      {result && (
        <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-96 whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
