/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

import Map, {
  Layer,
  ScaleControl,
  type LngLatBoundsLike,
  MapMouseEvent,
  type MapRef,
  Marker,
  NavigationControl,
  Source,
  ViewState,
  Popup,
} from 'react-map-gl';
import bbox from '@turf/bbox';
import { type FeatureCollection, type Geometry } from 'geojson';
import { Coordinates, LocationDetail } from '@/types';
import Pin from './pin';
import { VStack, Text } from '@chakra-ui/react';

type AtlasProps = {
  geojsonBase?: FeatureCollection;
  geojsonHighlight?: Geometry;
  setSelectedCoordinates: (coordinates: Coordinates) => void;
  locationDetails?: LocationDetail
};

type ViewportState = {
  longitude: number;
  latitude: number;
  zoom: number;
} & Partial<ViewState>

const AtlasMarkCoordinates = ({ geojsonBase, locationDetails, setSelectedCoordinates }: AtlasProps) => {
  const mapRef = React.useRef<MapRef | null>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    longitude: -13.9826,
    latitude: 33.7738,
    zoom: 17
  });
  const [markers, setMarker] = useState<any>(null);
  const [popupInfo, setPopupInfo] = useState<LocationDetail | null>(null);

  useEffect(() => {
    if (geojsonBase && mapRef.current) {
      mapRef.current?.fitBounds(bbox(geojsonBase) as LngLatBoundsLike, {
        padding: 20,
      });
    }
  }, [geojsonBase, mapRef]);

  useEffect(() => {
    if (locationDetails && locationDetails.name && locationDetails.coordinates) {
      setViewport({ zoom: 20, longitude: locationDetails.coordinates.longitude, latitude: locationDetails.coordinates.latitude });

      setMarker(
        <Marker
          key={`marker-village-location`}
          longitude={locationDetails.coordinates.longitude}
          latitude={locationDetails.coordinates.latitude}
          onClick={(e:any) => {
            e.originalEvent.stopPropagation();
            setPopupInfo(locationDetails);
          }}
        >
          <Pin size={18} />
        </Marker>
      )
    }
  }, [locationDetails]);

  const onMouseClick = (event: MapMouseEvent): void => {
    const { lng, lat } = event.lngLat;
    const coords = {
      longitude: Number(lng.toFixed(6)),
      latitude: Number(lat.toFixed(6)),
    }
    setSelectedCoordinates(coords)
    setMarker(
      <Marker
        key={`marker-village-location`}
        longitude={coords.longitude}
        latitude={coords.latitude}
        onClick={(e:any) => {
          e.originalEvent.stopPropagation();
          setPopupInfo({ name: 'Selected Location', coordinates: coords });
        }}
      >
        <Pin size={18} />
      </Marker>)
  };

  const onMoveHandler = (evt: { viewState: ViewportState }): void => {
    setViewport(evt.viewState);
  };

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={viewport}
      // mapStyle="mapbox://styles/axismaps/ckw0imrln8uvd15o7of1xevqu"
      // mapStyle={style}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      // onMouseMove={onMouseMove}
      onClick={onMouseClick}
      onMove={onMoveHandler}
      onLoad={() => {
        if (geojsonBase) {
          mapRef.current?.fitBounds(bbox(geojsonBase) as LngLatBoundsLike, {
            padding: 20,
          });
        }
      }}
    >
      <ScaleControl />
      <NavigationControl position='top-right' />

      {markers}

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

      {popupInfo && popupInfo.coordinates && (
        <Popup
          anchor="top"
          longitude={Number(popupInfo.coordinates.longitude)}
          latitude={Number(popupInfo.coordinates.latitude)}
          onClose={() => setPopupInfo(null)}
        >
          <VStack alignItems="left" fontSize="xs" gap={0} py={1}>
            <Text fontSize="sm" fontWeight="bold">{popupInfo.name}</Text>
          </VStack>
        </Popup>
      )}
    </Map>
  );
};

export default AtlasMarkCoordinates;
