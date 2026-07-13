import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export default function Logo({ className = '', size = 120 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Sky Blue Circular/Square Background */}
      <rect width="200" height="200" rx="20" fill="#38bdf8" />
      
      {/* Outer White Oval Border */}
      <rect
        x="42"
        y="12"
        width="116"
        height="176"
        rx="58"
        fill="#ffebd6"
        stroke="white"
        strokeWidth="6"
      />
      
      {/* Black Inner Oval Thin Border */}
      <rect
        x="45"
        y="15"
        width="110"
        height="170"
        rx="55"
        stroke="black"
        strokeWidth="1.5"
        fill="transparent"
      />
      
      {/* Sanskrit Text at top: "सा विद्या या विमुक्तये" */}
      <path
        id="textPathTop"
        d="M 52 75 A 48 48 0 0 1 148 75"
        fill="none"
        stroke="transparent"
      />
      <text fill="black" fontSize="13.5" fontWeight="bold" fontFamily="system-ui, sans-serif" letterSpacing="1">
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          सा विद्या या विमुक्तये
        </textPath>
      </text>

      {/* Book (Motif) */}
      {/* Bottom Cover Shadow/Thickness */}
      <path
        d="M 68 116 L 98 139 L 132 121 C 132 121 130 119 129 118 L 98 135 L 68 112 Z"
        fill="#0284c7"
        stroke="black"
        strokeWidth="1.5"
      />
      {/* Pages block */}
      <path
        d="M 65 106 L 95 129 L 135 107 L 132 121 L 98 139 L 68 116 Z"
        fill="white"
        stroke="black"
        strokeWidth="1.5"
      />
      <path
        d="M 65 106 L 98 126 L 135 107 Z"
        fill="white"
        stroke="black"
        strokeWidth="1.5"
      />
      {/* Book Lines / Spine Details */}
      <line x1="75" y1="113" x2="98" y2="128" stroke="black" strokeWidth="1" />
      <line x1="83" y1="119" x2="98" y2="130" stroke="black" strokeWidth="1" />
      {/* Ribbon bookmark */}
      <path d="M 98 126 L 98 138 L 102 135 L 106 138 L 106 122 Z" fill="#0284c7" />

      {/* Diya (Burning Lamp) resting on the Book */}
      {/* Diya Base */}
      <path
        d="M 83 108 C 83 95, 117 95, 117 108 C 117 117, 83 117, 83 108 Z"
        fill="black"
        stroke="#ea580c"
        strokeWidth="1.5"
      />
      {/* Diya Inner glow rim */}
      <ellipse cx="100" cy="104" rx="12" ry="4" fill="#f97316" />
      <ellipse cx="100" cy="104" rx="6" ry="2" fill="#facc15" />

      {/* Flame (Jyoti) */}
      <path
        d="M 100 58 C 92 84, 96 98, 100 102 C 104 98, 108 84, 100 58 Z"
        fill="url(#flameGradient)"
        stroke="#ea580c"
        strokeWidth="1"
      />
      {/* Flame Inner Core */}
      <path
        d="M 100 70 C 95 86, 98 96, 100 98 C 102 96, 105 86, 100 70 Z"
        fill="#facc15"
      />
      
      {/* Hindi Text at bottom: "विद्या भारती" */}
      <path
        id="textPathBottom"
        d="M 148 125 A 50 50 0 0 1 52 125"
        fill="none"
        stroke="transparent"
      />
      <text fill="black" fontSize="15" fontWeight="bold" fontFamily="system-ui, sans-serif" letterSpacing="1.2">
        <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
          विद्या भारती
        </textPath>
      </text>

      {/* Flame Color Gradient definitions */}
      <defs>
        <radialGradient id="flameGradient" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="85%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
      </defs>
    </svg>
  )
}
