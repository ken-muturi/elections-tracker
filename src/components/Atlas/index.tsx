import React, { useEffect, useRef } from 'react';
import Map, {
  Layer,
  type LngLatBoundsLike,
  type MapRef,
  Source,
} from 'react-map-gl';
import bbox from '@turf/bbox';
import { type FeatureCollection, type Geometry } from 'geojson';
// import { Box } from '@chakra-ui/react';

type AtlasProps = {
  geojsonBase?: FeatureCollection;
  geojsonHighlight?: Geometry;
};

const Atlas = ({ geojsonBase, geojsonHighlight }: AtlasProps) => {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (geojsonBase && mapRef.current) {
      mapRef.current?.fitBounds(bbox(geojsonBase) as LngLatBoundsLike, {
        padding: 20,
      });
    }
  }, [geojsonBase, mapRef]);

  // console.log(geojsonHighlight);

  return (
    <Map
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: 0,
        latitude: 20,
        zoom: 1,
      }}
      mapStyle="mapbox://styles/axismaps/ckw0imrln8uvd15o7of1xevqu"
      onLoad={() => {
        if (geojsonBase) {
          mapRef.current?.fitBounds(bbox(geojsonBase) as LngLatBoundsLike, {
            padding: 20,
          });
        }
      }}
    >
      {geojsonBase && (
        <Source id="base" type="geojson" data={geojsonBase}>
          <Layer
            id="base"
            type="fill"
            paint={{
              'fill-color': '#fff',
              'fill-opacity': 0.2,
            }}
          />
          <Layer
            id="geojson-line"
            type="line"
            paint={{
              'line-color': '#fff',
              'line-width': 2,
            }}
          />
        </Source>
      )}

      {geojsonHighlight && (
        <Source id="highlight" type="geojson" data={geojsonHighlight}>
          {geojsonHighlight.type === 'Point' ? (
            <Layer
              id="highlight"
              type="circle"
              paint={{
                'circle-color': '#FF0000',
                'circle-radius': 5,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#000',
                'circle-opacity': 0.8,
              }}
            />
          ) : (
            <Layer
              id="highlight"
              type="fill"
              beforeId="geojson-line"
              paint={{
                'fill-color': '#FF0000',
                'fill-opacity': 0.8,
              }}
            />
          )}
        </Source>
      )}
    </Map>
  );
};

export default Atlas;
