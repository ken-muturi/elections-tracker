import Modal from '@/components/Generic/Modal'
import { Image } from '@chakra-ui/react'
import React from 'react'

const PhotoModal = ({
  title,
  image,
  h = "40",
  rounded = false,
}: {
  rounded?: boolean;
  h?: number | string;
  title: string;
  image?: string;
}) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);
  const imageUrl = image
    ? `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_URL}${image}`
    : `https://placehold.co/500/D8E89B/dcfce7?text=${title}&font=roboto`;
  const isRounded = rounded ? { borderRadius: "full" } : {};
  return (
    <Modal
      title={title}
      open={isPhotoModalOpen}
      onOpenChange={setIsPhotoModalOpen}
      mainContent={
        <Image
          w="min-intrinsic"
          alignSelf="center"
          src={imageUrl}
          alt={title}
        />
      }
      size="full"
    >
      <Image
        {...isRounded}
        boxSize={`${h}px`}
        src={imageUrl}
        alt={title}
      />
    </Modal>
  );
};

export default React.memo(PhotoModal)