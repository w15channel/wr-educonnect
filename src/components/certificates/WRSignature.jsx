import React from 'react';

// Assinatura manuscrita "W.Ribeiro" em SVG
export default function WRSignature({ width = 180, style = {} }) {
  return (
    <div style={{ textAlign: 'center', ...style }}>
      <svg
        width={width}
        height={Math.round(width * 0.35)}
        viewBox="0 0 180 63"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* W */}
        <path d="M8 16 L18 46 L28 24 L38 46 L48 16" stroke="#1e3a5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        {/* . */}
        <circle cx="53" cy="46" r="2" fill="#1e3a5f"/>
        {/* R */}
        <path d="M60 16 L60 46" stroke="#1e3a5f" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <path d="M60 16 C60 16, 78 16, 78 26 C78 36, 60 36, 60 36" stroke="#1e3a5f" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <path d="M66 36 L80 46" stroke="#1e3a5f" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        {/* i */}
        <path d="M86 28 L86 46" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="86" cy="22" r="2" fill="#1e3a5f"/>
        {/* b */}
        <path d="M94 16 L94 46" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M94 28 C94 28, 110 24, 110 36 C110 46, 94 46, 94 46" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* e */}
        <path d="M116 37 C116 37, 132 37, 132 37" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M116 37 C116 24, 132 24, 132 34 C132 44, 116 46, 116 46 C116 46, 132 46, 132 46" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* i */}
        <path d="M138 28 L138 46" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="138" cy="22" r="2" fill="#1e3a5f"/>
        {/* r */}
        <path d="M144 28 L144 46" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M144 32 C144 28, 158 26, 160 30" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* o */}
        <ellipse cx="170" cy="37" rx="8" ry="9" stroke="#1e3a5f" strokeWidth="2" fill="none"/>
        {/* underline flourish */}
        <path d="M6 55 C30 51, 80 53, 130 51 C150 50, 165 52, 178 51" stroke="#c9a84c" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 4" fill="none"/>
      </svg>
    </div>
  );
}