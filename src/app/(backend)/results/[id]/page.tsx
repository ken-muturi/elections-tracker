import { Box, Text } from "@chakra-ui/react";
import { getElectionResults } from "@/services/Results";
import ResultsDashboard from "@/components/Dashboard/ResultsDashboard";
import { ElectionDashboardData } from "@/services/Results";

async function getData(id: string) {
  try {
    return await getElectionResults(id);
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unknown error occurred";
  }
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const data = await getData(id);

  if (typeof data === "string") {
    return (
      <Box p={4}>
        <Text color="red.500">{data}</Text>
      </Box>
    );
  }

  return <ResultsDashboard data={data as ElectionDashboardData} />;
};

export default Page;
