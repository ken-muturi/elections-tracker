/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect, useMemo } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  Layer,
  type MapRef,
  Source,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  ViewState,
} from "react-map-gl";
import {
  type MultiPolygon,
  type Polygon,
  type FeatureCollection,
  type Geometry,
} from "geojson";
import { Text, VStack, Image } from "@chakra-ui/react";

import style from "../style";

type AtlasProps = {
  geojsonHighlight?: Geometry;
  atlasData: any[];
  popupFields?: Array<Record<string, any>>;
  icon?: string;
};
type ViewportState = {
  longitude: number;
  latitude: number;
  zoom: number;
} & Partial<ViewState>;
type GeoJSONProps = { id: string; color?: string } & Record<
  string,
  string | number
>;

const Atlas = ({
  atlasData,
  popupFields = [
    {
      id: "fullname",
      label: "Extension Officer",
    },
    {
      id: "farmerOrganization",
      label: "Farmer Organization",
    },
    {
      id: "cadreTitle",
      label: "Cadre",
    },
  ],
  icon = "agro-processor.png",
}: AtlasProps) => {
  const { setSelected, defaultOpen } = useDashboard();

  const [geojsonPolygons] = useState<
    FeatureCollection<Polygon | MultiPolygon, GeoJSONProps> | undefined
  >();

  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    longitude: 33.561051, // Approximate center longitude
    latitude: -12.634133, // Approximate center latitude
    zoom: 7, // Initial zoom level
  });

  useEffect(() => {
    if (!defaultOpen) {
      setSelected(popupInfo);
    } else {
      setPopupInfo(atlasData?.find((m) => m.id === defaultOpen.id) ?? null);
    }
  }, [popupInfo, defaultOpen, atlasData]);

  const onMoveHandler = (evt: { viewState: ViewportState }): void => {
    setViewport(evt.viewState);
  };

  const atlasDataPins = useMemo(
    () =>
      atlasData?.map((d, index) => (
        <Marker
          key={`marker-${index}`}
          longitude={d.coordinates.longitude}
          latitude={d.coordinates.latitude}
          // anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setPopupInfo(d);
          }}
        >
          {/* <Pin size={18} /> */}
          <Image
            src={`/images/${icon}`}
            alt={d.name}
            width="20px"
            height="20px"
            style={{ cursor: "pointer" }}
          />
        </Marker>
      )),
    [atlasData, icon]
  );

  return (
    <>
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={viewport}
        mapStyle={style}
        // mapStyle='mapbox://styles/mapbox/streets-v9'
        onMove={onMoveHandler}
        interactiveLayerIds={["epas"]}
      >
        <GeolocateControl position="top-left" />
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl />

        {geojsonPolygons && (
          <Source id="epas" type="geojson" data={geojsonPolygons}>
            <Layer
              id="epas"
              type="fill"
              paint={{
                "fill-color": ["get", "color"],
                "fill-opacity": 1,
              }}
            />
            <Layer
              id="epa-line"
              type="line"
              paint={{
                "line-color": ["get", "borderColor"],
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  1, // 1px at zoom 5
                  10,
                  1, // 4px at zoom 10
                ],
                "line-opacity": 1,
              }}
            />
            <Layer
              id="geojson-line"
              type="line"
              paint={{
                "line-color": "#ddd",
                "line-width": 1,
                "line-opacity": 0.5,
              }}
            />
            <Layer
              id="geojson-line-2"
              type="line"
              paint={{
                "line-color": "#ddd",
                "line-width": 1,
                "line-opacity": 0.5,
              }}
            />
            <Layer
              type={"line"}
              id={"highlight"}
              paint={{
                "line-color": "#ddd",
                "line-width": 1,
                "line-opacity": [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  1,
                  0,
                ],
              }}
            />
          </Source>
        )}

        {atlasDataPins}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.coordinates.longitude)}
            latitude={Number(popupInfo.coordinates.latitude)}
            onClose={() => setPopupInfo(null)}
          >
            <VStack alignItems="left" fontSize="xs" gap={0} py={1}>
              {popupFields.map((field) => (
                <Text fontSize="sm" fontWeight="bold" key={field.id}>
                  {field.label}: {popupInfo[field.id] ?? ""}
                </Text>
              ))}
              <Text>
                Location: {popupInfo.district}, {popupInfo.ta}, {popupInfo.epa},{" "}
                {popupInfo.section}
              </Text>
              <Text>
                {popupInfo.latitude},{popupInfo.longitude}
              </Text>
            </VStack>
          </Popup>
        )}
      </Map>
    </>
  );
};

export default Atlas;
function useDashboard(): { setSelected: any; defaultOpen: any } {
  throw new Error("Function not implemented.");
}
