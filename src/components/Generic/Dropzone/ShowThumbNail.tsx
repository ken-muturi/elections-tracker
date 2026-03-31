import React from 'react'
import { Image, } from '@chakra-ui/react';
import Modal from '@/components/Generic/Modal';

const ShowThumbNail = ({ url, size = "50px", alt = "image" }: { size?: string | number, url: string, alt?: string }) => {
    return (
      <Modal
        size="cover"
        vh="80vh"
        mainContent={<Image objectFit="cover" src={url} alt={alt} />}
      >
        <Image src={url} alt={alt} boxSize={size} />
      </Modal>
    );
}

export default ShowThumbNail