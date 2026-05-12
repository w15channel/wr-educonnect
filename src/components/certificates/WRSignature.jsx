import React from 'react';
import { WR_SIGNATURE_IMAGE } from '@/lib/brand';

export default function WRSignature({ width = 220, style = {} }) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      <img
        src={WR_SIGNATURE_IMAGE}
        alt="Assinatura William Ribeiro"
        crossOrigin="anonymous"
        style={{ display: 'block', width, height: 'auto', margin: '0 auto', objectFit: 'contain' }}
      />
    </div>
  );
}