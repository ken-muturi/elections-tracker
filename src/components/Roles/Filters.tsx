import { Text, HStack} from '@chakra-ui/react'
import React from 'react'
import { FilterProps } from './type'
import { DatePicker } from '@/components/Generic/ChakraDatepicker'

type AFiltersProps = {
    filters: FilterProps,
    setFilters: (d: FilterProps) => void
}
const Filters = ({ setFilters, filters }: AFiltersProps) => {
    return (
        <HStack gap="4">
            <HStack>
                <Text fontSize="sm">Start Date</Text>
                <DatePicker
                    size="sm"
                    borderRadius="lg"
                    id="end-date"
                    value={filters.startDate}
                    name="startDate"
                    dateFormat="yyyy-MM-dd"
                    handleChange={(value: string) => {
                        setFilters({ ...filters, startDate: value })
                    }}
                />
            </HStack>
            <HStack>
                <Text fontSize="sm">End Date</Text>
                <DatePicker
                    borderRadius="lg"
                    size="sm"
                    id="end-date"
                    value={filters.endDate}
                    name="endDate"
                    dateFormat="yyyy-MM-dd"
                    handleChange={(value: string) => {
                        setFilters({ ...filters, endDate: value })
                    }}
                />
            </HStack>
        </HStack>
    )
}

export default Filters