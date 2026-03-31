import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Icon,
  Text,
  HStack,
  Box,
  VStack,
  Input,
  createToaster,
} from "@chakra-ui/react";

import { Field } from "@chakra-ui/react";
import { FaMapMarkerAlt } from "react-icons/fa";
import AtlasMarkCoordinates from "@/components/Atlas/Mapbox/MarkCoordinates";
import { Coordinates, LocationDetail } from "@/types";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";
import Modal from "../Modal";

type MapCoordinatesProps = {
  required?: boolean;
  title?: string;
  locationDetails?: LocationDetail;
  setLocationDetails: (d: LocationDetail) => void;
};

const SelectMapCoordinates = (
  {
    required = false,
    title = "Village",
    locationDetails,
    setLocationDetails,
  }: MapCoordinatesProps,
  ref: React.Ref<HTMLButtonElement>
) => {
  const { translate } = useUX();
  const toaster = createToaster({
    placement: "top-end",
  });
  const [open, setOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates>({
    longitude: -122.4,
    latitude: 37.8,
  });
  const [location, setLocationName] = useState<string>("");

  useEffect(() => {
    if (locationDetails && locationDetails?.name && locationDetails.coordinates) {
      setLocationName(locationDetails.name);
      setSelectedCoordinates(locationDetails.coordinates);
    }
  }, [locationDetails]);

  const saveLocationDetails = () => {
    if (location.trim().length > 0 && selectedCoordinates) {
      setLocationDetails({ name: location, coordinates: selectedCoordinates });
      setOpen(false);
    } else {
      toaster.create({
        title: "Error",
        description: `Please enter the ${title} name`,
        type: "error",
        duration: 5000,
      });
    }
  };

  const MapSelector = useCallback(() => {
    return (
      <VStack w="full" gap={4} alignItems="left">
        <Box h={{ base: "300px", lg: "400px" }} position="relative">
          <AtlasMarkCoordinates
            locationDetails={locationDetails}
            setSelectedCoordinates={setSelectedCoordinates}
            geojsonBase={undefined}
          />
        </Box>
        <Text fontSize="sm" color="gray.500">
          {translate(dictionary.zoom)}.
        </Text>
        <Box bg="gray.50" borderWidth="thin" borderColor="gray.100" p={2}>
          <Text fontSize="sm" color="gray.500">
            lat: {selectedCoordinates.latitude} lng:{" "}
            {selectedCoordinates.longitude}
          </Text>
        </Box>
        <Field.Root>
          <Field.Label>{title}</Field.Label>
          <Input
            borderWidth="2px"
            borderRadius="lg"
            defaultValue={location}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </Field.Root>
        <Box>
          <Button
            colorPalette="blue"
            disabled={location.trim().length < 3}
            onClick={saveLocationDetails}
            size="sm"
          >
            {translate(dictionary.save)}
          </Button>
        </Box>
      </VStack>
    );
  }, [location]);

  return (
    <Modal
      title={translate(dictionary.selectLocation)}
      size={"xl"}
      open={open}
      onOpenChange={(open) => setOpen(open)}
      mainContent={<MapSelector />}
    >
      <HStack color="blue.500" _hover={{ color: "blue.200" }} gap={2} p={1}>
        <Icon
          size="sm"
          cursor={"pointer"}
          color={"blue.500"}
          _hover={{ color: "blue.2100" }}
          aria-label="couldnt find village"
        >
          <FaMapMarkerAlt />
        </Icon>
        <Text fontSize="sm" cursor="pointer">
          Select {title.toLowerCase()} from map{" "}
          {required && (
            <Box as="span" color="red">
              *
            </Box>
          )}
        </Text>
      </HStack>
    </Modal>
  );
};

export default React.forwardRef(SelectMapCoordinates);