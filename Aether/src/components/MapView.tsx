import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { config } from '../constants/config';

export interface MapMarker {
  coordinates: [number, number];
  title?: string;
  emoji?: string;
  color?: string;
}

export interface RouteLine {
  id: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
  label?: string;
}

export interface GeofenceArea {
  id: string;
  coordinates: [number, number][];
  color?: string;
  label?: string;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routes?: RouteLine[];
  geofences?: GeofenceArea[];
  colorScheme?: 'Light' | 'Dark';
  mapStyle?: string;
  style?: ViewStyle;
  onMapClick?: (coords: { lng: number; lat: number }) => void;
  onMarkerClick?: (index: number) => void;
  interactive?: boolean;
}

const DEFAULT_CENTER: [number, number] = [139.6917, 35.6895];
const DEFAULT_ZOOM = 5;

export default function MapView({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  routes = [],
  geofences = [],
  colorScheme = 'Light',
  mapStyle,
  style,
  onMapClick,
  onMarkerClick,
  interactive = true,
}: MapViewProps) {
  const webRef = useRef<WebView>(null);
  const region = config.awsLocation.region;
  const apiKey = config.awsLocation.apiKey;
  const useMapStyle = mapStyle || config.awsLocation.mapStyle;

  const html = useMemo(() => {
    const markersJson = JSON.stringify(
      markers.map((m) => ({
        coordinates: m.coordinates,
        title: m.title || '',
        emoji: m.emoji || '📍',
        color: m.color || '#E8A87C',
      }))
    );
    const routesJson = JSON.stringify(routes);
    const geofencesJson = JSON.stringify(geofences);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .marker {
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .marker:hover { transform: scale(1.2); }
    .marker-inner {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .maplibregl-popup-content {
      font-family: -apple-system, sans-serif;
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var apiKey = '${apiKey}';
      var region = '${region}';
      var style = '${useMapStyle}';
      var colorScheme = '${colorScheme}';
      var centerLat = ${center[1]};
      var centerLng = ${center[0]};
      var zoomLevel = ${zoom};
      var isInteractive = ${interactive};

      var styleUrl = 'https://maps.geo.' + region + '.amazonaws.com/v2/styles/' + style + '/descriptor?key=' + apiKey + '&color-scheme=' + colorScheme;

      var map = new maplibregl.Map({
        container: 'map',
        style: styleUrl,
        center: [centerLng, centerLat],
        zoom: zoomLevel,
        validateStyle: false,
        attributionControl: false,
        dragRotate: isInteractive,
        touchZoomRotate: isInteractive,
        scrollZoom: isInteractive,
        dragPan: isInteractive,
        boxZoom: isInteractive,
        keyboard: isInteractive,
        doubleClickZoom: isInteractive,
        pitchWithRotate: false,
      });

      map.addControl(new maplibregl.NavigationControl({
        showCompass: false,
        showZoom: isInteractive,
      }), 'top-right');

      map.on('load', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapLoaded' }));
      });

      map.on('click', function(e) {
        if (isInteractive) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          }));
        }
      });

      // Markers
      var markers = ${markersJson};
      markers.forEach(function(m, idx) {
        var el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = m.color + '22';
        el.innerHTML = '<div class="marker-inner" style="background:' + m.color + '">' + m.emoji + '</div>';
        el.addEventListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', index: idx }));
        });
        var popup = null;
        if (m.title) {
          popup = new maplibregl.Popup({ offset: 25 }).setHTML('<b>' + m.title + '</b>');
        }
        new maplibregl.Marker({ element: el })
          .setLngLat(m.coordinates)
          .setPopup(popup)
          .addTo(map);
      });

      // Routes
      var routes = ${routesJson};
      routes.forEach(function(r) {
        if (r.coordinates && r.coordinates.length > 1) {
          map.addLayer({
            id: 'route-' + r.id,
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: r.coordinates,
                },
              },
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': r.color || '#3B82F6',
              'line-width': r.width || 4,
              'line-opacity': 0.8,
            },
          });
        }
      });

      // Geofences
      var geofences = ${geofencesJson};
      geofences.forEach(function(g) {
        if (g.coordinates && g.coordinates.length > 2) {
          map.addLayer({
            id: 'geofence-' + g.id,
            type: 'fill',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [g.coordinates],
                },
              },
            },
            paint: {
              'fill-color': g.color || '#10B981',
              'fill-opacity': 0.15,
            },
          });
          map.addLayer({
            id: 'geofence-outline-' + g.id,
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [g.coordinates],
                },
              },
            },
            paint: {
              'line-color': g.color || '#10B981',
              'line-width': 2,
              'line-opacity': 0.5,
              'line-dasharray': [4, 3],
            },
          });
        }
      });

      window.addEventListener('message', function(event) {
        try {
          var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'flyTo') {
            map.flyTo({
              center: data.coordinates,
              zoom: data.zoom || zoomLevel,
              duration: 800,
            });
          } else if (data.type === 'setMarkers') {
            document.querySelectorAll('.marker').forEach(function(el) { el.remove(); });
            data.markers.forEach(function(m, idx) {
              var el = document.createElement('div');
              el.className = 'marker';
              el.style.backgroundColor = m.color + '22';
              el.innerHTML = '<div class="marker-inner" style="background:' + m.color + '">' + (m.emoji || '📍') + '</div>';
              el.addEventListener('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', index: idx }));
              });
              var popup = null;
              if (m.title) {
                popup = new maplibregl.Popup({ offset: 25 }).setHTML('<b>' + m.title + '</b>');
              }
              new maplibregl.Marker({ element: el })
                .setLngLat(m.coordinates)
                .setPopup(popup)
                .addTo(map);
            });
          }
        } catch(e) {}
      });
    })();
  </script>
</body>
</html>`;
  }, [apiKey, region, useMapStyle, colorScheme, center, zoom, markers, routes, geofences, interactive]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapClick' && onMapClick) {
          onMapClick({ lng: data.lng, lat: data.lat });
        }
        if (data.type === 'markerClick' && onMarkerClick) {
          onMarkerClick(data.index);
        }
      } catch {}
    },
    [onMapClick, onMarkerClick]
  );

  const flyTo = useCallback((coords: [number, number], newZoom?: number) => {
    webRef.current?.postMessage(
      JSON.stringify({ type: 'flyTo', coordinates: coords, zoom: newZoom || zoom })
    );
  }, [zoom]);

  const updateMarkers = useCallback((newMarkers: MapMarker[]) => {
    webRef.current?.postMessage(
      JSON.stringify({ type: 'setMarkers', markers: newMarkers.map((m) => ({ ...m })) })
    );
  }, []);

  if (!apiKey) {
    return (
      <View style={[styles.container, style, styles.placeholder]}>
        <Text style={styles.placeholderEmoji}>🗺️</Text>
        <Text style={styles.placeholderTitle}>Map not configured</Text>
        <Text style={styles.placeholderDesc}>Add your API key to .env</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3D5A3D',
    padding: 24,
  },
  placeholderEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholderDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
