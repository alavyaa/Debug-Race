
import React, { useMemo } from "react";

interface AvatarProps {
  userId: string;
  username: string;
  lobbyPosition?: number;
  size?: "small" | "medium" | "large";
}

const HELMET_COLORS = [
  "#FF3B3B", // Player 1 - Red
  "#3B82F6", // Player 2 - Blue
  "#F59E0B", // Player 3 - Orange
  "#22C55E", // Player 4 - Green
];

const generateF1Avatar = (userId: string, helmetColor: string): string => {
  const initial = userId.charAt(0).toUpperCase();

  const svgString = `
  <svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">

    <!-- Shadow -->
    <ellipse cx="150" cy="395" rx="65" ry="15" fill="black" opacity="0.15"/>

    <!-- Legs -->
    <rect x="110" y="270" width="30" height="100" rx="12" fill="${helmetColor}"/>
    <rect x="160" y="270" width="30" height="100" rx="12" fill="${helmetColor}"/>

    <!-- Shoes -->
    <rect x="105" y="360" width="40" height="22" rx="6" fill="#111"/>
    <rect x="155" y="360" width="40" height="22" rx="6" fill="#111"/>

    <!-- Body Suit -->
    <rect x="95" y="150" width="110" height="140" rx="30" fill="${helmetColor}"/>

    <!-- Suit stripe -->
    <rect x="140" y="150" width="20" height="140" fill="white" opacity="0.25"/>

    <!-- Arms -->
    <rect x="65" y="170" width="35" height="110" rx="20" fill="${helmetColor}"/>
    <rect x="200" y="170" width="35" height="110" rx="20" fill="${helmetColor}"/>

    <!-- Gloves -->
    <circle cx="75" cy="285" r="14" fill="#111"/>
    <circle cx="225" cy="285" r="14" fill="#111"/>

    <!-- Helmet -->
    <ellipse cx="150" cy="110" rx="70" ry="75" fill="${helmetColor}"/>

    <!-- Helmet highlight -->
    <ellipse cx="150" cy="95" rx="60" ry="60" fill="white" opacity="0.1"/>

    <!-- Visor -->
    <rect x="90" y="90" width="120" height="45" rx="20" fill="#111"/>

    <!-- Visor reflection -->
    <rect x="105" y="95" width="90" height="15" rx="10" fill="#00eaff" opacity="0.25"/>

    <!-- Helmet Initial -->
    <text x="150" y="70"
      font-size="28"
      font-weight="bold"
      fill="white"
      text-anchor="middle"
      font-family="Arial">
      ${initial}
    </text>

  </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

export const F1Avatar: React.FC<AvatarProps> = ({
  userId,
  username,
  lobbyPosition = 0,
  size = "medium",
}) => {
  const helmetColor = useMemo(() => {
    if (lobbyPosition >= 0 && lobbyPosition < 4) {
      return HELMET_COLORS[lobbyPosition];
    }

    const hash = userId.split("").reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    return HELMET_COLORS[Math.abs(hash) % HELMET_COLORS.length];
  }, [userId, lobbyPosition]);

  const avatarSrc = useMemo(() => {
    return generateF1Avatar(userId, helmetColor);
  }, [userId, helmetColor]);

  const sizeConfig = {
    small: 70,
    medium: 110,
    large: 150,
  };

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <img
        src={avatarSrc}
        alt={`${username}'s avatar`}
        style={{
          width: sizeConfig[size],
          height: sizeConfig[size] * 1.4,
          objectFit: "contain",
          filter: `drop-shadow(0 0 8px ${helmetColor})`,
        }}
      />

      <span
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: helmetColor,
        }}
      >
        {username}
      </span>
    </div>
  );
};
