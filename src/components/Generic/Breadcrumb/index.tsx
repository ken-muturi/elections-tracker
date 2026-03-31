// /components/NextBreadcrumb.tsx
'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Breadcrumb } from '@chakra-ui/react'
import { MdChevronRight } from 'react-icons/md'

type NextBreadcrumbProps = {
    capitalizeLinks?: boolean
}

const NextBreadcrumb = ({ capitalizeLinks = true }: NextBreadcrumbProps) => {

    const paths = usePathname()
    const pathNames = paths.split('/').filter(path => path)

    return (
        <Breadcrumb.Root>
            <Breadcrumb.List>
                <Breadcrumb.Item>
                    <Breadcrumb.Link href='/'>Home</Breadcrumb.Link>
                </Breadcrumb.Item>
                {pathNames.map((link, index) => {
                    const href = `/${pathNames.slice(0, index + 1).join('/')}`
                    const itemLink = capitalizeLinks ? link[0].toUpperCase() + link.slice(1, link.length) : link
                    return (
                        <Breadcrumb.Item key={index}>
                            <Breadcrumb.Separator>
                                <MdChevronRight color='gray.500' />
                            </Breadcrumb.Separator>
                            <Breadcrumb.Link href={href}>{itemLink}</Breadcrumb.Link>
                        </Breadcrumb.Item>
                    )
                })}
            </Breadcrumb.List>
        </Breadcrumb.Root>
    )
}

export default NextBreadcrumb