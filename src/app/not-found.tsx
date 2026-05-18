import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react'

export default function NotFound() {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={8}>
      <VStack gap={6} textAlign="center" maxW={400}>
        <Flex
          w={16} h={16} borderRadius="2xl" bg="#eff9d1"
          align="center" justify="center" fontSize="2xl"
        >
          🔍
        </Flex>
        <Box
          px={3} py={1} bg="#eff9d1" color="#798217"
          borderRadius="full" fontSize="xs" fontWeight={700}
          letterSpacing="wide"
        >
          404 — NOT FOUND
        </Box>
        <VStack gap={2}>
          <Heading fontSize="xl" fontWeight={800} color="gray.900">
            Page not found
          </Heading>
          <Text fontSize="sm" color="gray.500" lineHeight={1.6}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </Text>
        </VStack>
        <Link href="/dashboard">
          <Flex
            gap={2} px={5} py={2.5} bg="#0f172a" color="white"
            borderRadius="lg" fontSize="sm" fontWeight={600}
            cursor="pointer" align="center"
            _hover={{ bg: '#1e293b' }} transition="background 0.15s"
          >
            <FiArrowLeft />
            <Text>Back to Dashboard</Text>
          </Flex>
        </Link>
      </VStack>
    </Flex>
  )
}
