import React from 'react';

interface QuantumCryptsLogoProps {
  className?: string;
}

export default function QuantumCryptsLogo({ className = 'w-10 h-10' }: QuantumCryptsLogoProps) {
  return (
    <svg
      id="quantum-crypts-svg-logo"
      viewBox="0 0 500 500"
      className={`${className} select-none`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Noise filter to create authentic grunge/rough textured edges */}
      <defs>
        <filter id="grunge-texture" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Solid Black Background */}
      <rect width="500" height="500" fill="#000000" rx="80" />

      {/* Subtle background tech matrix accents */}
      <g stroke="#ffffff" strokeWidth="1" opacity="0.08" filter="url(#grunge-texture)">
        <circle cx="250" cy="250" r="190" fill="none" strokeWidth="2" />
        <circle cx="250" cy="250" r="140" fill="none" strokeWidth="1" />
        <line x1="50" y1="250" x2="450" y2="250" />
        <line x1="250" y1="50" x2="250" y2="450" />
      </g>

      {/* Main text group with the displacement grunge filter applied */}
      <g filter="url(#grunge-texture)" fill="#ffffff">
        {/* "QUANTUM" text inside the filter */}
        <text
          x="250"
          y="200"
          textAnchor="middle"
          fontSize="76"
          fontWeight="900"
          fontFamily="'Impact', 'Arial Black', sans-serif"
          letterSpacing="4"
          className="italic select-none"
        >
          QUANTUM
        </text>
        
        {/* "CRYPTS" text inside the filter */}
        <text
          x="250"
          y="335"
          textAnchor="middle"
          fontSize="92"
          fontWeight="900"
          fontFamily="'Impact', 'Arial Black', sans-serif"
          letterSpacing="3"
          className="italic select-none"
        >
          CRYPTS
        </text>
      </g>

      {/* Realistic dry-brush overlays to enhance the grunge aesthetic */}
      <g stroke="#ffffff" strokeLinecap="round" filter="url(#grunge-texture)" opacity="0.85">
        {/* Dynamic slash cuts mirroring paint brushes */}
        <path d="M 220 100 L 175 390" strokeWidth="9" />
        <path d="M 275 110 L 315 400" strokeWidth="7" />
        
        {/* Top/Middle splatters & scratch cuts */}
        <path d="M 90 245 L 410 240" strokeWidth="12" />
        
        {/* Thick dry-brush underline */}
        <path d="M 70 395 L 430 400" strokeWidth="16" strokeDasharray="35 15 20 10 40 5" />
      </g>
    </svg>
  );
}
