import { Info } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
// import { useTranslation } from "react-i18next";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Home() {
  // const { t } = useTranslation();
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    // Предотвращаем повторную инициализацию карты
    if (map.current) return;

    if (!mapboxToken) {
      console.error(
        "Mapbox token is missing. Add VITE_MAPBOX_TOKEN to the project .env file.",
      );
      return undefined;
    }

    let isUnmounted = false;

    const initializeMap = (center, zoom, addLocationMarker = false) => {
      if (isUnmounted || map.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom,
        minZoom: 0,
        projection: "globe",
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      if (addLocationMarker) {
        new mapboxgl.Marker({ color: "#e11d48" })
          .setLngLat(center)
          .addTo(map.current);
      }
    };

    const fallbackCenter = [30.5234, 50.4501];

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          initializeMap([coords.longitude, coords.latitude], 1, true);
        },
        (error) => {
          console.warn("Не удалось получить местоположение:", error.message);
          initializeMap(fallbackCenter, 1);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    } else {
      console.warn("Геолокация не поддерживается этим браузером.");
      initializeMap(fallbackCenter, 1);
    }

    // Очистка при размонтировании компонента
    return () => {
      isUnmounted = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <main className="flex w-full items-center justify-center overflow-hidden">
      <div className="flex w-full flex-col items-start bg-gray-800">
        <div
          ref={mapContainer}
          style={{
            width: "100%",
            height: "min(500px, calc(100dvh - 180px))",
            borderRadius: "4px",
          }}
        />
      </div>
    </main>
  );
}
