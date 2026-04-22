import { Box } from "@chakra-ui/react";
import { getPollingStations } from "@/services/PollingStations";
import PollingStationsTable from "@/components/PollingStations/Table";
import { PollingStation, Stream } from "@prisma/client";

type PollingStationWithStreams = PollingStation & { streams: Stream[] };

async function getStations() {
  try {
    return (await getPollingStations()) as PollingStationWithStreams[];
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred";
  }
}

const Page = async () => {
  const stations = await getStations();
  if (typeof stations === "string") {
    return <Box>{stations}</Box>;
  }
  return <PollingStationsTable stations={stations} />;
};

export default Page;
