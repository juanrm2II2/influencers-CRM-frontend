// export default function MockImage(props: any) {
//   return <img {...props} />;
// }
// __mocks__/next/image.tsx
import React from 'react';

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  unoptimized?: boolean;
  [key: string]: unknown;
};

const MockImage = ({ src, alt, width, height, className, ...rest }: ImageProps) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      {...rest}
    />
  );
};

export default MockImage;
