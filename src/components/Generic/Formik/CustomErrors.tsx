import { Alert, Text, VStack, } from '@chakra-ui/react'
import { FormikErrors } from 'formik'
import React from 'react'

type CustomErrorsProps<T> = {
    errors: FormikErrors<T>
}

function CustomErrors<T>({ errors }: CustomErrorsProps<T>) {
    if (Object.keys(errors).length === 0) {
        return <></>
    }

    return Object.keys(errors).length > 0 && (
        <Alert.Root status='error' variant='subtle'>
            <Alert.Indicator />
            <VStack align="stretch" gap={2} fontSize="xs" width="full">
                {Object.values(errors).map((error) => {
                    if (Array.isArray(error)) {
                        return error.map(err => Object.values(err).map(e => <Text key={e as string}>{e as string}</Text>))
                    }
                    return (
                        <Alert.Description key={error as string}>{error as string}</Alert.Description>
                    )
                })}
            </VStack>
        </Alert.Root>
    )
}

export default CustomErrors